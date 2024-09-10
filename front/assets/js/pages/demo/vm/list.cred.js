
document.addEventListener("DOMContentLoaded", async function () {
  const response = await webconsolejs["common/api/http"].commonAPIPost('/api/demogetusercred', null)
  if (response.status != 200) {
    alert("demogetusercred get Fail")
  } else {
    response.data.responseData.cspCredentials.forEach(function (cred) {
      switch (cred.provider) {
        case "aws":
          let awsAccessKeyId = document.getElementById("awsAccessKeyId")
          let awsSecretAccessKey = document.getElementById("awsSecretAccessKey")
          let awsSessionToken = document.getElementById("awsSessionToken")
          let awsExpiration = document.getElementById("awsExpiration")

          awsAccessKeyId.textContent = cred.credential.AccessKeyId;
          awsSecretAccessKey.textContent = cred.credential.SecretAccessKey;
          awsSessionToken.textContent = cred.credential.SessionToken;
          awsExpiration.textContent = cred.credential.Expiration;
          break;

        case "alibaba":
          let alibabaSecurityToken = document.getElementById("alibabaSecurityToken")
          let alibabaAccessKeyId = document.getElementById("alibabaAccessKeyId")
          let alibabaAccessKeySecret = document.getElementById("alibabaAccessKeySecret")
          let alibabaExpiration = document.getElementById("alibabaExpiration")

          alibabaSecurityToken.textContent = cred.credential.SecurityToken;
          alibabaAccessKeyId.textContent = cred.credential.AccessKeyId;
          alibabaAccessKeySecret.textContent = cred.credential.AccessKeySecret;
          alibabaExpiration.textContent = cred.credential.Expiration;
          break;
        default:
          console.log("err provider");
          console.log(cred.provider);
      }
    });


  }
});