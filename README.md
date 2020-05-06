
# List YouTube channel videos

Simple script to fetch the list of all videos uploaded to a given YouTube channel.

To run it, first make sure you have `nvm` installed and then:

    nvm install
    npm install

You need to obtain a developer key in order to be able to call YouTube APIs. Do this here:

https://console.cloud.google.com/apis/credentials

Click the "Create credentials" and add a new API key.

Copy the new key and paste it into a new file named `config.json` in this folder. Here's how it should look like:

    {
      "apiKey": "your-key-goes-here"
    }

Finally, run it:

    node list-videos UUQRPDZMSwXFEDS67uc7kIdg

The string `UUQRPDZMSwXFEDS67uc7kIdg` is a sample YouTube channel. You'll want to replace it with some other channel's id.

If everything goes well, an output file will be created with the name `<channel-id>.tsv`.

References:

- https://stackoverflow.com/a/27872244/778272
- https://developers.google.com/youtube/v3
