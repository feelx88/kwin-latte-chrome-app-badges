const regexes = [
  /.*\(([0-9]+|.)\).*/, // Rocket.Chat, WhatsApp etc.
  /.*Nachricht.+gesendet.*/, // Hangouts
];
const classes = /.*crx_(.*).*/;
const alnum = /[0-9]+/;

function clientListener(client) {
  // Only match chrome windows
  if (!classes.test(client.resourceClass)) {
    return;
  }

  client.captionChanged.connect(captionWatcher(client));
  captionWatcher(client)();
}

function captionWatcher(client) {
  return function () {
    const name = `chrome-${
      client.resourceClass.toString().match(classes)[1]
    }-Default`;
    const active = regexes.reduce(
      (previous, regex) => previous || regex.test(client.caption),
      false
    );
    let count = "0";

    if (active) {
      for (const regex of regexes) {
        count = client.caption.match(regex);

        if (!count) {
          continue;
        }

        count = count[1].toString();
        if (!alnum.test(count)) {
          count = "1";
        }
        break;
      }
    }

    client.demandsAttention = active;
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
