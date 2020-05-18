import TwitchClient from "twitch";

const getChannelData = async (twitchClient: TwitchClient, channel: string) => {
  const channelData = await twitchClient.helix.streams.getStreamByUserName(
    channel
  );

  return channelData;
};

export default getChannelData;
