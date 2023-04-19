//const url = process.env['INFLUX_URL'] || 'http://localhost:8086'
export const url = process.env['INFLUX_URL'] || 'http://127.0.0.1:8086'
/** InfluxDB authorization token */
export const token = process.env['INFLUX_TOKEN'] || 'TOKEN'
/** Organization within InfluxDB  */
export const org = process.env['INFLUX_ORG'] || 'ORG'
/**InfluxDB bucket used in examples  */
export const bucket = 'client-side'