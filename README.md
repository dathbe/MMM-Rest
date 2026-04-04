# Module: MMM-Rest

**PLEASE NOTE THAT THE LOCATION OF THIS REPOSITORY HAS RECENTLY CHANGED.  PLEASE UPDATE YOUR INSTALLATIONS.**

The `MMM-Rest` module is a [MagicMirror²](https://github.com/MagicMirrorOrg/MagicMirror) addon.
This module collects data via HTTP calls and displays it on your mirror in a table.

![Rest Displays](screenshot.png)

## Installation

```sh
cd ~/MagicMirror/modules
git clone https://github.com/dathbe/MMM-Rest
cd MMM-Rest
npm ci --omit=dev
```
Dependencies:
- [sprintf-js](https://www.npmjs.com/package/sprintf-js)
- [undici](https://www.npmjs.com/package/undici)

Note: `request` dependency was removed with 2025-11-17 release.

## Updating the module

```sh
cd ~/MagicMirror/modules/MMM-Rest
git pull
npm ci --omit=dev
```

## Using the module

To use this module, add it to the modules array in the `config/config.js` file:

```js
{
  module: 'MMM-Rest',
  position: 'top_left', // This can be any of the regions.
                            // Best results in one of the side regions like: top_left
  config: {
    debug: false,
    forceAlign: false,
    mappings: {
      on_off: {
        true: 'on',
        false: 'off',
      },
      temperature: {
        1: 'cold',
        2: 'warm',
        3: 'HOT',
      },
    },
    sections: [
      {
        format: '%.1f&deg;<span class="wi wi-celsius"></span>',
        url: 'https://raw.githubusercontent.com/dathbe/MMM-Rest/refs/heads/main/demo/float2254',
      },
      {
        format: [
          { range: [0 , 10], format: '<span style="color:green">%d&percnt;</span>'},
          { range: [10, 20], format: '<span style="color:yellow">%d&percnt;</span>'},
          { range: [30, ], format: '<span style="color:red">%d&percnt;</span>'},
          { string: 'HOT', format: '<span style="color:red">%d&percnt;</span>'},
          { format: '%d&percnt;'}
        ],
        url: 'https://raw.githubusercontent.com/dathbe/MMM-Rest/refs/heads/main/demo/float591',
      },
      {
        format: '%s',
        mapping: 'temperature',
        url: 'https://raw.githubusercontent.com/dathbe/MMM-Rest/refs/heads/main/demo/int2',
      },
      {
        format: '%d&percnt;<span class="wi wi-humidity"></span>',
        url: 'https://raw.githubusercontent.com/dathbe/MMM-Rest/refs/heads/main/demo/float621',
      },
      {
        format: 'Lights %s',
        mapping: 'on_off',
        url: 'https://raw.githubusercontent.com/dathbe/MMM-Rest/refs/heads/main/demo/stringtrue',
      },
      {
        format: [
          { dateOptions: { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }, format: '<span style="color:green">%s</span>'},
        ],
        url: 'https://raw.githubusercontent.com/dathbe/MMM-Rest/refs/heads/main/demo/date',
      },
      {
        format: [
          { range: [0, 1000], format: '<span style="color:green">%d W</span>'},
          { range: [1000, 1000000], format: '%.1f kW', transform: 'value/1000'},
          { format: '%.1f MW', transform: 'value/1000000'}
        ],
        url: 'https://raw.githubusercontent.com/dathbe/MMM-Rest/refs/heads/main/demo/int10005',
      },
    ],
    output: [
      ['Living Room','@1','@2'],
      ['Kitchen','@3','@4'],
      ['Fridge','','@5'],
      ['Last Updated','@6'],
      ['Solar Production','','@7'],
    ],
  },
}
```

## Configuration options

The following properties can be configured:

| Option               | Description
| -------              | -------
| sections             | Defines the REST endpoints to connect to (see below for more information).<br><br>**Type:** `array` of `dict`s<br>**Default value:** `[ { url: 'https://raw.githubusercontent.com/dathbe/MMM-Rest/refs/heads/main/demo/int42', }, ]`
| mappings             | Allows mapping returned values to other values (see below for more information).<br><br>**Type:** `dict` of `dict`s<br>**Default value:** `null`
| output               | Formats the output table for the display. A cell containing an `@` followed by a number represents the section id (starting with 1) of the REST urls defined in `sections`<br><br>**Type:** 2-dimensional `array` (rows and columns)<br>**Default value:** `[ ['The answer', '@1'], ]`
| updateInterval       | How often the module refreshes.<br><br>**Type:** `int` (milliseconds)<br>**Default value:** `60 * 1000` (60 seconds)
| initialLoadDelay     | How long to wait for the first load.<br><br>**Type:** `int` (milliseconds)<br>**Default value:** `0`
| animationSpeed       | Duration of fadeover effect for dom updates.<br><br>**Type:** `int` (milliseconds)<br>**Default value:** `2 * 1000` (2 seconds)
| forceAlign           | Describes the alignment behavior of the table.<br>`false` will align description cells to the left and variable cells (e.g., @1) to the right.<br>`true` will align all cells in the leftmost column to the left and all other cells to the right.<br><br>**Type:** `boolean`<br>**Default value:** `false`
| allowSelfSignedCerts | Allows insecure fetching of urls with untrusted SSL certificates (e.g., self-signed certificates). *Use with caution and only if you know what you are doing.*<br><br>**Type:** `boolean`<br>**Default value:** `false`

### Sections

Sections consist of up to three elements:  `url`, `format`, and `mapping`.

#### Sections > URL
`url` (required) is the url to call.  It has to return a single piece of data like a REST API would (though it does not necessarily need to be a REST API; the example config uses text files).

#### Sections > Format
`format` (optional) defines the format to use for displaying the resulting data.  Examples of the various `format` options are included in the example config above.  `format` can either be a string or an array of dicts.

If `format` is a string (the simplest method of defining a format), use `sprintf()` formatting, which is described [here](https://www.npmjs.com/package/sprintf-js). Example:
```js
format: '%s',
```
For more complicated `format` configuation, you can either define ranges or options for datetime objects.  

For ranges, the array is processed from top to bottom and first match will be used.  Each dict can be a "range" or a "string" to match. The last entry could be a default without "range" or "string". Leaving one value of the range empty means "ignore this bound". You may also add a `transform` function to convert the value before displaying it. Use a string that is a common mathematical function with the value of the raw REST data is `value`. E.g., `value/1000` will divide the raw value by 1000 before displaying. Useful for converting units. Note: transform happens after any range is matched. Example with ranges so that values less than 1000 are displayed in green and in watts, values between 1000 and 1000000 are converted to kilowatts, and larger values are converted to megawatts:
```js
format: [
  { range: [0, 1000], format: '<span style="color:green">%d W</span>'},
  { range: [1000, 1000000], format: '%.1f kW', transform: 'value/1000'},
  { format: '%.1f MW', transform: 'value/1000000'}
],
```

For datetime objects, use the "dateOptions" key to specify that the expected value is an ISO 8601 DateTime object (may work for other date formats as well, as long as the javascript function `new Date()` takes that format). Formatting options described [here](https://stackoverflow.com/questions/3552461/how-do-i-format-a-date-in-javascript). Example:
```js
format: [
  { dateOptions: { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }, format: '<span style="color:green">%s</span>'},
],
```

Omitting a `format` will display the raw string value of the data returned by the `url`.

#### Sections > Mapping
`mapping` (optional) is the desired mapping key from the `mappings` config option (see below).  Example usage is shown above in the example config.

### Mappings

Mappings are a `dict` of `dict`s for the mapping of raw values to other values.  They consist of two elements: a name for the mapping, and a key/value pair.  Examples of `mappings` usage are shown in the example config above.

The name of the mapping can be any string.  You will use it in the `mapping` option under `sections`, described above.

The key/value pairs describe what will be mapped from (key) and to (value).  For example, the pair `1: 'cold'` will take any `1` returned from a url and covert it to `'cold'` before displaying it.

## Contributing

If you find any problems, bugs or have questions, please [open a GitHub issue](https://github.com/dathbe/MMM-Rest/issues) in this repository.

Pull requests are of course also very welcome!

### Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

### Developer commands

Coming soon.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.

## Thank You

A special thanks goes to [@Tuxdiver]([https://github.com/jclarke0000/](https://github.com/Tuxdiver)), who was the original author of this module and wrote most of the code.
