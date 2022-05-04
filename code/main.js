const regex = /.*\(([0-9]+|.)\).*/;
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
    const active = regex.test(client.caption);
    let count = "0";

    if (active) {
      count = client.caption.match(regex)[1].toString();
      if (!alnum.test(count)) {
        count = "1";
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
