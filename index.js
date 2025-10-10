import { Account, Client } from "react-native-appwrite";

export default async ({ req, res, log }) => {
  try {

    const { token } = JSON.parse(req.body);

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const account = new Account(client);

    const appwriteJwt = await account.createJWT();

    return res.json({ appwriteJwt: appwriteJwt.jwt });
  } catch (err) {
    log(err);
    return res.json({ error: err.message });
  }
};