import ChatClient from "twitch-chat-client";
import TwitchClient from "twitch";
import * as fs from "fs-extra";
import getChannelData from "./helpers/getChannelData";
import getUser from "./helpers/getUser";
import * as moment from "moment";
moment.locale("de");

(async () => {
  const tokenData = JSON.parse(await fs.readFile("./tokens.json", "utf-8"));
  const keys = JSON.parse(await fs.readFile("./keys.json", "utf-8"));

  const twitchClient = TwitchClient.withCredentials(
    keys.clientId,
    tokenData.accessToken,
    undefined,
    {
      clientSecret: keys.clientSecret,
      refreshToken: tokenData.refreshToken,
      expiry:
        tokenData.expiryTimestamp === null
          ? null
          : new Date(tokenData.expiryTimestamp),
      onRefresh: async ({ accessToken, refreshToken, expiryDate }) => {
        const newTokenData = {
          accessToken,
          refreshToken,
          expiryTimestamp: expiryDate === null ? null : expiryDate.getTime()
        };

        await fs.writeFile(
          "./tokens.json",
          JSON.stringify(newTokenData, null, 4)
        );
      }
    }
  );

  const channelData = await getChannelData(twitchClient, "noelbank");
  const isChannelOnline = !!channelData;
  const offlineMessage = "Noel ist zurzeit Offline.";

  const chatClient = ChatClient.forTwitchClient(twitchClient, {
    channels: ["NoelBank"]
  });

  chatClient.connect();

  let msg = "";

  chatClient.onPrivmsg(async (channel, _user, message) => {
    const user = await getUser(twitchClient, _user);

    switch (message) {
      case "!uptime":
        if (isChannelOnline) {
          msg = `Noel ist online seit ${moment(channelData.startDate).fromNow(
            true
          )}`;
        } else {
          msg = offlineMessage;
        }
        break;

      case "!was":
        if (isChannelOnline) {
          const game = await channelData.getGame();
          msg = `Noel spielt derzeit ${game.name}`;
        } else {
          msg = offlineMessage;
        }
        break;

      case "!title":
        break;
    }

    if (message.length >= 250) {
      chatClient.say(
        channel,
        `/timeout ${user.name} 1 Maximale zeichen anzahl (250).`
      );
      console.log("user timeouted", user.name);

      msg = `@${user.name} du hast zu viele Zeichen benutzt (250)!`;
    }

    chatClient.say(channel, msg);
    msg = "";
  });

  chatClient.onChatClear(channel => {
    chatClient.say(channel, "Der Chat wurde geleert.");
  });
})();
