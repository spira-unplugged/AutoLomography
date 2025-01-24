function main() {
  const service = getService();
  if (service.hasAccess()) {
    Logger.log("Already authorized");
  } else {
    const authorizationUrl = service.getAuthorizationUrl();
    Logger.log('Open the following URL and re-run the script: %s', authorizationUrl);
  }
}

function getService1() {
  pkceChallengeVerifier();
  const userProps = PropertiesService.getUserProperties();
  const scriptProps = PropertiesService.getScriptProperties();

  // スクリプト プロパティからCLIENT_IDとCLIENT_SECRETを取得
  const CLIENT_ID = scriptProps.getProperty('CLIENT_ID');
  const CLIENT_SECRET = scriptProps.getProperty('CLIENT_SECRET');

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('CLIENT_ID or CLIENT_SECRET is missing in Script Properties');
  }

  return OAuth2.createService('twitter')
    .setAuthorizationBaseUrl('https://twitter.com/i/oauth2/authorize')
    .setTokenUrl('https://api.twitter.com/2/oauth2/token?code_verifier=' + userProps.getProperty("code_verifier"))
    .setClientId(CLIENT_ID)
    .setClientSecret(CLIENT_SECRET)
    .setCallbackFunction('authCallback')
    .setPropertyStore(userProps)
    .setScope('users.read tweet.read tweet.write offline.access')
    .setParam('response_type', 'code')
    .setParam('code_challenge_method', 'S256')
    .setParam('code_challenge', userProps.getProperty("code_challenge"))
    .setTokenHeaders({
      'Authorization': 'Basic ' + Utilities.base64Encode(CLIENT_ID + ':' + CLIENT_SECRET),
      'Content-Type': 'application/x-www-form-urlencoded'
    });
}

function authCallback(request) {
  const service = getService();
  const authorized = service.handleCallback(request);
  if (authorized) {
    return HtmlService.createHtmlOutput('Success!');
  } else {
    return HtmlService.createHtmlOutput('Denied.');
  }
}

function pkceChallengeVerifier() {
  var userProps = PropertiesService.getUserProperties();
  if (!userProps.getProperty("code_verifier")) {
    var verifier = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

    for (var i = 0; i < 128; i++) {
      verifier += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    var sha256Hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, verifier);

    var challenge = Utilities.base64Encode(sha256Hash)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    userProps.setProperty("code_verifier", verifier);
    userProps.setProperty("code_challenge", challenge);
  }
}

function logRedirectUri() {
  const service = getService();
  Logger.log(service.getRedirectUri());
}

function setApiCredentials() {
  const scriptProps = PropertiesService.getScriptProperties();

  // プロンプトでユーザーに入力を求める
  const CLIENT_ID = Browser.inputBox('Enter CLIENT_ID:', Browser.Buttons.OK_CANCEL);
  if (CLIENT_ID === 'cancel') {
    Logger.log('Operation canceled by user.');
    return;
  }

  const CLIENT_SECRET = Browser.inputBox('Enter CLIENT_SECRET:', Browser.Buttons.OK_CANCEL);
  if (CLIENT_SECRET === 'cancel') {
    Logger.log('Operation canceled by user.');
    return;
  }

  // スクリプトプロパティに保存
  scriptProps.setProperty('CLIENT_ID', CLIENT_ID);
  scriptProps.setProperty('CLIENT_SECRET', CLIENT_SECRET);

  Logger.log('API credentials set in Script Properties');
}
