{

  "schemaName": "fs_filetypes",
  "dimensionFieldSpecs": [
    { "name": "dirPath", "dataType": "STRING" },
    { "name": "ts", "dataType": "LONG" },
    { "name": "extension", "dataType": "STRING" }
  ],
  "metricFieldSpecs": [
    { "name": "count", "dataType": "INT" }
  ],
"dateTimeFieldSpecs": [
    {
      "name": "ingestionTime",
      "dataType": "LONG",
      "notNull": false,
      "format": "1:MILLISECONDS:EPOCH",
      "granularity": "1:MILLISECONDS"
    }
  ]
}

