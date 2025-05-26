export const environment = {
  production: false,
  logstashUrl: 'http://localhost:5044',
  elasticsearchUrl: 'http://localhost:9200',
  kibanaUrl: 'http://localhost:5601',
  enableLogging: true,
  logLevel: 'debug',
  batchSize: 5,
  batchTimeout: 30000,
  offlineStorageEnabled: true,
  performanceThreshold: 1000
};
