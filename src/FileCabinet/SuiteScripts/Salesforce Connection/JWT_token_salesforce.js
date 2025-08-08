
define(['N/https', 'N/log', 'N/runtime', '/SuiteScripts/Salesforce Connection/jsrsasign-all-min', 'N/file', 'N/cache'], 
    function (https, log, runtime, rsasign, file,cacheModule) {
    
        const CLIENT_ID = '3MVG9Gdzj3taRxuNDfqkDoWGxZ5gQ7SJWuM4zfccbdzeFCeDNqUwxGOllS53wUbZBUDTr8cU7pfdRq_5gM_6c';
        const USERNAME = 'salesforce.eurokars.support@eurokars.com.devbox';
        const AUDIENCE = 'https://test.salesforce.com';
        const SF_TOKEN_ENDPOINT = 'https://eurokars--devbox.sandbox.my.salesforce.com/services/oauth2/token';
        const PRIVATE_KEY_FILE_ID = '8068';
        
    
        function getPrivateKey() {
            try {
                const f = file.load({ id: PRIVATE_KEY_FILE_ID });
                return f.getContents().replace(/\\n/g, '\n');
            } catch (e) {
                log.error({ title: 'Private Key Load Error', details: e.message });
                throw e;
            }
        }
    
        function createJWT(privateKey) {
            const header = JSON.stringify({ alg: "RS256", typ: "JWT" });
            const payload = JSON.stringify({
                iss: CLIENT_ID,
                sub: USERNAME,
                aud: AUDIENCE,
                exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiry
            });
    
            try {
                return rsasign.KJUR.jws.JWS.sign(null, header, payload, privateKey);
            } catch (e) {
                log.error({ title: 'JWT Signing Error', details: e.message });
                throw e;
            }
        }
    
        function getSalesforceAccessToken() {
            const privateKey = getPrivateKey();
            const jwt = createJWT(privateKey);
            log.debug({ title: 'Generated JWT', details: jwt });
            try {
                const response = https.post({
                    url: SF_TOKEN_ENDPOINT,
                    body: {
                        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                        assertion: jwt
                    },
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });
    
                const responseBody = JSON.parse(response.body);
                log.debug({ title: 'Salesforce Response', details: responseBody });
    
                if (responseBody.access_token) {
                    log.debug({ title: 'Salesforce Access Token', details: responseBody.access_token });
                     
                    return responseBody.access_token;
                } else {
                    log.error({ title: 'Access Token Not Received', details: responseBody });
                    return null;
                }
            } catch (e) {
                log.error({ title: 'Salesforce Token Request Error', details: e.message });
                throw e;
            }
        }
  
function getAccessToken_cache() {
    const CACHE_NAME = 'salesforce_token_cache';
    const CACHE_KEY = 'sf_access_token';

    const cache = cacheModule.getCache({
        name: CACHE_NAME,
        scope: cacheModule.Scope.PROTECTED
    });
    // Try to retrieve token from cache
    const cachedToken = cache.get({
        key: CACHE_KEY,
        loader: function () {
            log.debug('Token not found or expired. Generating new token...');
            const newToken = getSalesforceAccessToken(); // Your existing function
            // Cache for 1 hour (3600 seconds)
            cache.put({
                key: CACHE_KEY,
                value: newToken,
                ttl: 3600
            });

            return newToken;
        }
    });

    log.debug('Using Salesforce Access Token', cachedToken);
    return cachedToken;
}    
        return {
            getSalesforceAccessToken: getSalesforceAccessToken,
            getAccessToken_cache: getAccessToken_cache
        };
    });
    