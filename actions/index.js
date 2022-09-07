const auth = require("@adobe/jwt-auth");
const axios = require("axios");
const _config = require("./config.js");

async function main(params) {
  // fetch auth token
  const { access_token } = await auth(_config.credentials);

  try {
    // get previous ecids for audience
    let prevState = await axios({
      method: 'get',
      url: `https://mc.adobe.io/${_config.tenant}/target/audiences/${_config.audienceId}`,
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'X-Api-Key': _config.credentials.clientId,
        'Content-Type': 'application/vnd.adobe.target.v3+json'
      }
    });
    prevState = prevState.data;

    // update with new ecid value
    const allECIDs = prevState.targetRule.equalsIgnoreCase;
    const incomingECID = params.event.event['com.adobe.mcloud.pipeline.pipelineMessage']['com.adobe.mcloud.protocol.trigger'].mcId
    if (!allECIDs.includes(incomingECID)) {
      allECIDs.push(incomingECID);

      const config = {
        method: 'put',
        url: `https://mc.adobe.io/${_config.tenant}/target/audiences/${_config.audienceId}`,
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'X-Api-Key': _config.credentials.clientId,
          'Content-Type': 'application/vnd.adobe.target.v3+json'
        },
        data: JSON.stringify({
          name: prevState.name,
          targetRule: {
            equalsIgnoreCase: allECIDs,
            mbox: prevState.targetRule.mbox
          }
        })
      }
      let newState = await axios(config)
      newState = newState.data;

      return { newState };
    }

    return { message: 'ECID already added' };
  } catch (err) {
    return { err };
  }
}

exports.main = main;
