console.log("starting..");

var { client } = require("./client");
var { telegram, telegramApi } = require("tdl-lib");

var telegrambot = new telegram(client["app_id"], client["app_hash"], `./client/${client["bot_user_id"]}`);
var telegramuser = new telegram(client["app_id"], client["app_hash"], `./client/${client["phone_number"]}`);
var tg = new telegramApi(telegrambot.client);
var tg_user = new telegramApi(telegramuser.client);

var fs = require("fs/promises");

var timer = require("timers/promises");

var get_auth_state = ['authorizationStateWaitPhoneNumber', 'authorizationStateWaitCode', 'authorizationStateWaitPassword', 'authorizationStateReady'];
var set_auth_state = ['setAuthenticationPhoneNumber', 'checkAuthenticationCode', 'checkAuthenticationPassword'];
var type_auth_state = ['phone_number', 'code', 'password'];


function check_admin(array, index) {
    if (array.indexOf(index) > -1) {
        return true;
    } else {
        return true;
    }
}


function acces_data(data, check_user) {
    if (data.indexOf(check_user) > -1) {
        return true;
    } else {
        return false;
    }
}

var curAuthState = {};
var curAuthData = {};

telegrambot.client.on('error', function (err) {
    console.error('Got error:', JSON.stringify(err, null, 2));
})

telegrambot.client.on('destroy', function () {
    console.log('Destroy event');
})

telegrambot.on('update', async function (update) {
    try {

        if (update) {
            if (update["callback_query"]) {
                var cb = update["callback_query"];
                var cbm = cb["message"];
                var chat_id = cbm["chat"]["id"];
                var user_id = cb["from"]["id"];
                var text = cb["data"] ?? "";
                try {
                    if (text) {
                        if (RegExp("^login$", "i").exec(text)) {
                            var isClientUserStart = await startClientUser(user_id);
                            if (isClientUserStart) {
                                var data = {
                                    "chat_id": chat_id,
                                    "text": `Hay Perkenalkan saya bot tolong gunakan saya degan bijak yah`,
                                };
                                return await tg.request("sendMessage", data);
                            } else {
                                return await tg.sendMessage(chat_id, "Start Client UserBot Gagal!");
                            }
                        }
                       
                    }
                } catch (e) {
                    var data = {
                        "chat_id": chat_id,
                        "text": e.message
                    };
                    return await tg.request("sendMessage", data);
                }

            }

            if (update["message"]) {
                var msg = update["message"];
                var chat_id = msg["chat"]["id"];
                var user_id = msg["from"]["id"];
                var chat_type = String(msg["chat"]["type"]).replace(/(super)/i, "");
                var text = msg["text"] ?? "";
                var is_outgoing = msg["outgoing"] ?? false;
                try {
                    if (!is_outgoing) {

                        if (text) {

                            if (RegExp("^/jsondump$", "i").exec(text)) {
                                var data = {
                                    "chat_id": chat_id,
                                    "text": JSON.stringify(msg, null, 2)
                                };
                                return await tg.request("sendMessage", data);
                            }

                            if (RegExp("/start", "i").exec(text)) {
                                if (acces_data(client["admins_user_id"], user_id)) {
                                    var data = {
                                        "chat_id": chat_id,
                                        "text": "Hey Perkenalkan saya adalah bot",
                                        "reply_markup": {
                                            "inline_keyboard": [
                                                [
                                                    {
                                                        "text": "Login User Bot",
                                                        "callback_data": "login"
                                                    }
                                                ]
                                            ]
                                        }
                                    };
                                    return await tg.request("sendMessage", data);
                                } else {
                                    var data = {
                                        "chat_id": chat_id,
                                        "text": "Maaf bot ini khusus admin saja yah!"
                                    };
                                    return await tg.request("sendMessage", data);
                                }
                            }
                            if (RegExp("/ping", "i").exec(text)) {
                                var time = (Date.now() / 1000) - msg["date"];
                                var data = {
                                    "chat_id": chat_id,
                                    "text": `Pong ${time.toFixed(3)}`
                                };
                                return await tg.request("sendMessage", data);
                            }


                            if (RegExp("^private$", "i").exec(chat_type)) {
                                if (acces_data(client["admins_user_id"], user_id)) {
                                    if (RegExp("^/account$", "i").exec(text)) {
                                        var data = {
                                            "chat_id": chat_id,
                                            "text": "Account",
                                            "reply_markup": {
                                                "inline_keyboard": [
                                                    [
                                                        {
                                                            "text": "Login User Bot",
                                                            "callback_data": "login"
                                                        }
                                                    ]
                                                ]
                                            }
                                        };
                                        return await tg.request("sendMessage", data);
                                    }
                                    if (/^(-.* )/i.exec(text)) {
                                        await tg.sendMessage(chat_id, "Please Wait");
                                        var input = String(text).split(" ");
                                        var param = {};
                                        if (input.length == 2) {
                                            for (var x in type_auth_state) {
                                                if ("-" + type_auth_state[x] == input[0]) {
                                                    curAuthData[type_auth_state[x]] = input[1];
                                                    param["_"] = set_auth_state[x];
                                                    param[type_auth_state[x]] = curAuthData[type_auth_state[x]];
                                                    await timer.setTimeout(2000);
                                                    return await sendAuthClientUser(param);
                                                }
                                            }
                                        }
                                        return await tg.sendMessage(chat_id, "ulangi lagi!");

                                    }
                                } else {
                                    return await tg.sendMessage(chat_id, "Oops command ini khusus admin tolong kamu jangan pakai ya!");
                                }

                            }
                        }

                    }
                } catch (e) {
                    var data = {
                        "chat_id": chat_id,
                        "text": e.message
                    };
                    return await tg.request("sendMessage", data);

                }
            }

        }

    } catch (e) {
        console.log(e);
    }
})


async function sendAuthClientUser(param) {
    try {
        await telegramuser.client.invoke(param);
        return true;
    } catch (e) {
        console.log(e)
        return false
    }
}

telegramuser.client.on('error', function (err) {
    console.error('Got error:', JSON.stringify(err, null, 2));
})

telegramuser.client.on('destroy', function () {
    console.log('Destroy event');
})

var cur_user_id = "";

telegramuser.on('update', async function (update) {
    try {

        if (update) {
            if (RegExp("^updateAuthorizationState$", "i").exec(update['_'])) {

                if (check_admin(client["admins_user_id"], cur_user_id)) {
                    if (RegExp(`^${get_auth_state[0]}$`, "i").exec(update["authorization_state"]['_'])) {
                        curAuthState[cur_user_id] = get_auth_state[0];
                        return await tg.sendMessage(cur_user_id, "Silakan ketik <b>Nomor Ponsel</b>\nformat <code>-phone_number " + client["phone_number"] + "</code>", "HTML");
                    }

                    if (RegExp(`^${get_auth_state[1]}$`, "i").exec(update["authorization_state"]['_'])) {
                        curAuthState[cur_user_id] = get_auth_state[1];
                        return await tg.sendMessage(cur_user_id, "Silakan ketik <b>Auth Code</b>\nformat <code>-code NOMOR</code>\nContoh <code>-code 12345</code>", "HTML");
                    }

                    if (RegExp(`^${get_auth_state[2]}$`, "i").exec(update["authorization_state"]['_'])) {
                        curAuthState[cur_user_id] = get_auth_state[2];
                        return await tg.sendMessage(cur_user_id, "Silakan ketik <b>Password</b>\nformat <code>-password TEXT</code>\nContoh <code>-password qwerty123</code>", "HTML");
                    }

                    if (RegExp(`^${get_auth_state[3]}$`, "i").exec(update.authorization_state['_'])) {
                        curAuthState[cur_user_id] = get_auth_state[3];
                        var get_active = await tg_user.invoke("getActiveSessions");
                        var pesan = "📥 Event: " + get_active["_"];
                        for (var x in get_active.sessions) {
                            pesan += '\n\n🔑 Api_Id: ' + get_active.sessions[x]["api_id"];
                            pesan += '\n📱 Model: ' + get_active.sessions[x]["device_model"];
                            pesan += '\n📲 Device: ' + get_active.sessions[x]["platform"];
                            pesan += '\n🔧 System: ' + get_active.sessions[x]["system_version"];
                            pesan += '\n💻 Ip: ' + get_active.sessions[x]["ip"];
                            pesan += '\n🚪 Location: ' + get_active.sessions[x]["country"];
                        }
                        await tg.sendMessage(cur_user_id, pesan);
                        var getME = await tg_user.getMe();
                        var pesan = "📥 Event: " + getME["_"];
                        pesan += '\n\n👤 First Name: ' + getME["first_name"];
                        if (getME["last_name"]) {
                            pesan += '\n👤 Last Name: ' + getME["last_name"];
                        }
                        if (getME["username"]) {
                            pesan += '\n🔰 Username: @' + getME["username"];
                        }
                        if (getME["phone_number"]) {
                            pesan += '\n☎️ Phone: ' + getME["phone_number"];
                        }
                        pesan += "\n";
                        pesan += `\n- contact ${getME["is_contact"]}`;
                        pesan += `\n- mutual_contact ${getME["is_mutual_contact"]}`;
                        pesan += `\n- support ${getME["is_support"]}`;
                        await tg.sendMessage(cur_user_id, pesan);
                        var data = {
                            "chat_id": cur_user_id,
                            "text": "Pastikan user sudah join ke channel target yah\njika belum typing /join @usernmaechannel di userbot"
                        };
                        return await tg.request("sendMessage", data);
                    }
                } else {
                    if (RegExp(`^(${get_auth_state[0]}|${get_auth_state[1]}${get_auth_state[2]}|${get_auth_state[3]})$`, "i").exec(update.authorization_state['_'])) {
                        return await tg.sendMessage(cur_user_id, 'Kamu tidak punya akses!');
                    }
                }
            }
            if (update["channel_post"]) {
                var msg = update["channel_post"];
                var text = msg["text"] ?? "";
                var caption = msg["caption"] ?? "";
                var is_outgoing = msg["outgoing"] ?? false;
                var msgr = msg["reply_to_message"] ?? false;
                var user_id = msg["from"]["id"];
                var chat_id = msg["chat"]["id"];
                var chat_type = String(msg["chat"]["type"]).replace(RegExp("super", "i"), "");
                var chat_title = msg["chat"]["title"] ?? "";
                var chat_username = (msg["chat"]["username"]) ? `@${msg["chat"]["username"]}` : "";
                var msg_id = msg["message_id"];
                var fromId = msg["from"]["id"];
                var fromFname = msg["from"]["first_name"];
                var fromLname = msg["from"]["last_name"] ?? "";
                var fromFullName = `${fromFname} ${fromLname}`;
                var fromUsername = (msg["from"]["username"]) ? `@${msg["from"]["username"]}` : "";
                var fromLanguagecode = msg["from"]["language_code"] ?? "id";
                var mentionFromMarkdown = `[${fromFullName}](tg://user?id=${user_id})`;
                var mentionFromHtml = `<a href='tg://user?id=${user_id}'>${fromFullName}</a>`;
                var key = { "chat": { "id": chat_id } };

                var regex = /(?<token>0x[a-z-0-9]+)/i;
                if (regex.exec(text)) {
                    var { token } = text.match(regex).groups;
                    await timer.setTimeout(2000);
                    var message = `/safe ${token}`;
                    try {
                        var option = {
                            "chat_id": 1990154044,
                            "text": message
                        };
                        return await tg_user.request("sendMessage", option);
                    } catch (e) {
                        var sendBotStartMessage = await tg_user.request("sendBotStartMessage", { "username": "@SafeAnalyzerbot" });
                        if (sendBotStartMessage) {
                            await timer.setTimeout(10000);
                            var option = {
                                "chat_id": 1990154044,
                                "text": message
                            };
                            return await tg_user.request("sendMessage", option);
                        } else {
                            await timer.setTimeout(2000);
                            console.log("failed");
                            process.exit();
                        }

                    }
                }

            }

            if (update["message"]) {
                var msg = update["message"];
                var chat_id = msg["chat"]["id"];
                var user_id = msg["from"]["id"];
                var chat_type = String(msg["chat"]["type"]).replace(/(super)/i, "");
                var text = msg["text"] ?? "";
                var is_outgoing = msg["outgoing"] ?? false;
                try {

                    if (text) {

                        if (RegExp("/ping", "i").exec(text)) {
                            var time = (Date.now() / 1000) - msg["date"];
                            var data = {
                                "chat_id": chat_id,
                                "text": `Pong ${time.toFixed(3)}`
                            };
                            return await tg_user.request("sendMessage", data);
                        }

                        if (is_outgoing) {
                            var regex = /^(\/join @[a-z-0-9_]+)$/i;
                            if (regex.exec(text)) {
                                var { query } = text.match(/(?<query>@[a-z-0-9_]+)/i).groups;
                                await tg_user.sendMessage(chat_id, "Search And join " + query);
                                var searchPublicChats = await tg_user.request("searchPublicChats", { "query": String(query).replace("@", "") });
                                if (searchPublicChats) {
                                    var result = searchPublicChats["result"];
                                    if (result) {
                                        for (var ii = 0; ii < result.length; ii++) {
                                            var loop_dat = result[ii];
                                            if (loop_dat["username"] == query) {
                                                if (String(loop_dat["status"]).toString().toLocaleLowerCase() == "left") {
                                                    var message = "Join Chat";
                                                    message += `\nUsername: @${query}`;
                                                    message += `\nTitle: ${loop_dat["title"]}`;
                                                    await tg_user.sendMessage(chat_id, message);
                                                    await timer.setTimeout(2000);
                                                    var joinChat = await tg_user.joinChat(loop_dat["id"]);
                                                    if (joinChat["_"] == "ok") {
                                                        await timer.setTimeout(2000);
                                                        return await tg_user.sendMessage(chat_id, "succes");
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }

                            }
                        }

                        if (!is_outgoing) {
                            if (chat_type == "private") {
                                if (RegExp("join", "i").exec(text)) {
                                    var query = "@BscSafeSniper";
                                    await tg.sendMessage(cur_user_id, "search: " + query);
                                    await timer.setTimeout(2000);
                                    var searchPublicChats = await tg_user.request("searchPublicChats", { "query": String(query).replace("@", "") });
                                    if (searchPublicChats) {
                                        var result = searchPublicChats["result"];
                                        if (result) {
                                            for (var ii = 0; ii < result.length; ii++) {
                                                var loop_dat = result[ii];
                                                if (loop_dat["username"] == query) {
                                                    if (String(loop_dat["status"]).toString().toLocaleLowerCase() == "left") {
                                                        var message = "Join Chat";
                                                        message += `\nUsername: @${query}`;
                                                        message += `\nTitle: ${loop_dat["title"]}`;
                                                        await tg.sendMessage(cur_user_id, message);
                                                        await timer.setTimeout(2000);
                                                        var joinChat = await tg_user.joinChat(loop_dat["id"]);
                                                        if (joinChat["_"] == "ok") {
                                                            await timer.setTimeout(2000);
                                                            return await tg.sendMessage(cur_user_id, "succes");
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }

                                }
                            }
                        }
                    }
                } catch (e) {
                    var data = {
                        "chat_id": chat_id,
                        "text": e.message
                    };
                    return await tg_user.request("sendMessage", data);

                }
            }


        }
    } catch (e) {
        console.log(e.message);
        return await tg.sendMessage(cur_user_id, e.message);
    }
})

async function startClientUser(user_id) {
    try {
        cur_user_id = user_id;
        var hasil = await telegramuser.user();
        return hasil;
    } catch (e) {
        console.log(e);
        return false;
    }
}
if (typeof client["token_bot"] == "string" && client["token_bot"].split(":").length == 2) {
    telegrambot.bot(client["token_bot"]).then(function () {
        console.log("Succes login bot");
    }).catch(function () {
        console.log("Failed");
    });
} else {
    console.log("Tolong isi token bot ya!");
    process.exit();
}