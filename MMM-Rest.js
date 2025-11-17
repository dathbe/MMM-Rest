/* global Module */

/* MagicMirror²
 * Module: MMM-Rest
 *
 * By Dirk Melchers
 * MIT Licensed.
 */

Module.register("MMM-Rest",{

	// Default module config.
	defaults: {
        debug: false,
        updateInterval: 60 * 1000, 
	animationSpeed: 2 * 1000,
	initialLoadDelay: 0,
	forceAlign: false,
        sections: [
                    {
                        suffix: '',
                        digits: 0,
                        url: 'http://www.dirk-melchers.de/echo.php?text=42',
                    },  
        ],
        output: [
            ['The answer','@1']
        ],

	},
	// Define required scripts.
	getStyles: function() {
		return ["MMM-Rest.css"];
	},
    
	getScripts: function() {
        return [
			this.file("node_modules/sprintf-js/dist/sprintf.min.js")
        ];
	},
    
    debugmsg: function() {
        if (this.config.debug) {
            var args = [].slice.call(arguments);
            Log.info.apply(console, args);
        }
    },
    
	// Define start sequence.
	start: function() {
		Log.info("Starting module: " + this.name);
        
		this.debugVar = "";

		this.sections = this.config.sections;
        this.mappings = this.config.mappings;
        
		this.loaded = false;
		this.scheduleUpdate(this.config.initialLoadDelay);

		this.updateTimer = null;
        
        // store the REST results here
        this.sectionData = [];
	},

	// Override dom generator.
	getDom: function() {
        var self = this;

        this.debugmsg('MMM-Rest: getDom');
        
        // create wrapper <div>
		var wrapper = document.createElement("div");
        
        // debug messages
        if (this.debugVar !== "") {
			wrapper.innerHTML = self.debugVar;
			wrapper.className = "dimmed light xsmall";
			return wrapper;
		}

        // Loading message
		if (!this.loaded) {
			wrapper.innerHTML = "MMM-Rest Loading...";
			wrapper.className = "dimmed light small";
			return wrapper;
		}
        
        // create table
        var tableHTML=document.createElement("table");
        tableHTML.className="small";
        
        // loop over all output rows
        for (var row_id in self.config.output) {
            this.debugmsg('MMM-Rest: getDom row='+row_id);
            
            var row = self.config.output[row_id];
            
            // create <tr>
            var tr = document.createElement("tr");
            tableHTML.appendChild(tr);

            // loop over all columns in this row
            for (var col_id in row) {
                var col = row[col_id];
                var td = document.createElement("td");

                // does the col match @[0-9]+?
                var data_ids = col.match(/^@(\d+)$/);

                // we have a regexp match - so don't show the col, but the sectionData in the right format
                if (data_ids !== null) {

                    // id of the section
                    var section_id = (data_ids[1])-1;
                    
                    // get value - process only if not undef
                    var value = self.sectionData[section_id];
                    if (typeof value !== 'undefined' ) {

                        // get format
                        var options = false;
                        var format = self.sections[section_id].format;
                        // fallback for old config
                        if (!format) {
                            var digits = self.sections[section_id].digits;
                            var suffix = self.sections[section_id].suffix;
                            format = "%."+digits+"f"+suffix;

                        } else if (format.constructor === Array) {

                            var result='';
                            this.debugmsg("MMM-Rest: new format section found");

                            for (var condition_id in format) {
                                var condition=format[condition_id];
                                this.debugmsg("MMM-Rest: check condition: ",condition);
                                if (typeof condition['range'] != 'undefined') {
                                    this.debugmsg("MMM-Rest: range defined: ",condition['range']);
                                    var min=condition['range'][0];
                                    var max=condition['range'][1];
                                    var match = false;
                                    if (typeof min != 'undefined') {
                                        if (parseFloat(value) >= min) {
                                            match = true;
                                        } else {
                                            match = false;
                                        }
                                    } else {
                                        match = true;
                                    }
                                    if (typeof max != 'undefined') {
                                        if (parseFloat(value) < max) {
                                            match = true;
                                        } else {
                                            match = false;
                                        }
                                    }
                                    this.debugmsg("MMM-Rest: match is: "+match);
                                    if (match) {
                                        result = condition['format'];
                                        if (condition['transform']) {
                                            value = parseFloat(value);
                                            value = eval(condition['transform']);
                                        }
                                        break;
                                    }
                                } else if (condition['string']) {
                                    if (value == condition['string']) {
                                        result = condition['format'];
                                        break;
                                    }
                                } else if (condition['dateOptions']) {
                         options = condition['dateOptions'];
                         result = condition['format'];
                        } else {
                                    result = condition['format'];
                    if (condition['transform']) {
                        value = parseFloat(value);
                        value = eval(condition['transform']);
                    }
                                    break;
                                }
                            }

                            this.debugmsg("MMM-Rest: final format is: "+result);
                            format = result;
                        }
                        
                        // get mapping
                        var mapping_name = self.sections[section_id].mapping;
                        if (mapping_name) {
                            mapping = self.mappings[mapping_name];
                            if (mapping) {
                                value = mapping[value];
                            }
                        }
    
                        // format column using sprintf
                        if (format.search(/%.\df|%f/i) > 1 || format.search('%d') > -1) {
                            col_text = sprintf(format, parseFloat(value));
                        } else if (options != false) {
                            value = new Date(value).toLocaleString(config.locale, options);
                            col_text = sprintf(format, value);
                        } else {
                            col_text = sprintf(format, value);
                        }
                    } else {
                        col_text = '...';
                    }
                    if (this.config.forceAlign === true && col_id == 0) {
			td.className="align-left";
		    } else {
			td.className="align-right";
		    }
                } else {
                    col_text = col;
		    if (this.config.forceAlign === true && col_id != 0) {
                    	td.className="align-right";
		    } else {
			td.className="align-left";
		    }
                }

                // set content and append to row
    		    td.innerHTML=col_text;
                tr.appendChild(td);
            }            
        }
        
        // append table to wrapper
        wrapper.appendChild(tableHTML);
        
		return wrapper;
	},


	getData: function() {

        var self = this;
        this.debugmsg('MMM-Rest: getData');
        
        // loop over all sections
        for (var id in self.sections) {
            var section = self.sections[id];
            this.debugmsg('MMM-Rest: getData section id: '+id);

            this.sendSocketNotification(
                'MMM_REST_REQUEST',
                {
                    id: id,
                    url: section.url,
		    tableID: JSON.stringify(this.config.sections)
                }
            );
        }
        
        self.scheduleUpdate(self.updateInterval);
	},

    processResult: function(id, data) {

        // store the data in the sectionData array       
        this.sectionData[id] = data;
        
        this.debugmsg('MMM-Rest: Process result section: ' + id);
        
		this.loaded = true;
		this.debugVar = "";
        
		this.updateDom(this.config.animationSpeed);
	},
    
    socketNotificationReceived: function(notification, payload) {
        if (notification === 'MMM_REST_RESPONSE' && payload.tableID == JSON.stringify(this.config.sections) ) {
            this.debugmsg('received:' + notification);
            if(payload.data){
                this.debugmsg("process result:"+payload.id+" data:"+payload.data);
                this.processResult(payload.id, payload.data);
            }
        }
    },
    

	scheduleUpdate: function(delay) {
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}

		var self = this;
		setTimeout(function() {
			self.getData();
		}, nextLoad);
        
	},
});
