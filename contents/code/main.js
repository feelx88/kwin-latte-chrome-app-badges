const captions = [
  {
    regex: /.*\(([0-9]+|.)\).*/, // Rocket.Chat, WhatsApp etc.
    attention: true,
  },
  {
    regex: /.*(Nachricht).+gesendet.*/, // Hangouts
    attention: false,
  },
];
const classes = /.*crx_(.*).*/;
const alnum = /[0-9]+/;

function clientListener(client) {
  client.captionChanged.connect(captionWatcher(client));
  captionWatcher(client)();
}

function captionWatcher(client) {
  return function () {
    // Only match chrome windows
    if (!classes.test(client.resourceClass)) {
      return;
    }

    const name = `chrome-${
      client.resourceClass.toString().match(classes)[1]
    }-Default`;
    const active = captions.reduce(
      (previous, caption) => previous || caption.regex.test(client.caption),
      false
    );
    let count = "0";

    if (active) {
      for (const caption of captions) {
        count = client.caption.match(caption.regex);

        if (!count) {
          continue;
        }

        count = count[1].toString();
        if (!alnum.test(count)) {
          count = "1";
        }

        if (caption.attention) {
          client.demandsAttention = true;
        }

        break;
      }
    }

    callDBus(
      "org.kde.lattedock",
      "/Latte",
      "org.kde.LatteDock",
      "updateDockItemBadge",
      name,
      count
    );
  };
}

workspace.clientAdded.connect(clientListener);
const clients = workspace.clientList();
for (let x = 0; x < clients.length; ++x) {
  clientListener(clients[x]);
}
