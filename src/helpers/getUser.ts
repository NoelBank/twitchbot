import TwitchClient from "twitch";

const getUser = async (twitchClient: TwitchClient, user: string) => {
  const userData = await twitchClient.helix.users.getUserByName(user);
  return userData;
};

export default getUser;
