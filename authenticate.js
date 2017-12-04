function authenticate(member) {
  var informations;
  require('http').createServer(function(req,res) {
    informations = req.url;
    res.end();
  });
  var exit;
  const euEmote = client.emojis.get(emoji.eu);
  const naEmote = client.emojis.get(emoji.na);
  const ruEmote = client.emojis.get(emoji.ru);
  const asiaEmote = client.emojis.get(emoji.asia);
  const xboxEmote = client.emojis.get(emoji.xbox);
  const psEmote = client.emojis.get(emoji.ps);
  const blitzEmote = client.emojis.get(emoji.blitz);
  const guestEmote = client.emojis.get(emoji.guest);
  member.send({embed: {
    color: 1039662,
    title: "Welcome to World of Tanks Discord Server!",
    description: "To get started, please react your main region you play on:",
    fields: [
      {
        name: "PC:",
        value: `${euEmote} for EU\n${naEmote} for NA\n${ruEmote} for RU\n${asiaEmote} for Asia`
      },
      {
        name: "Console:",
        value: `${xboxEmote} for Xbox\n${psEmote} for PlayStation`
      },
      {
        name: "Others:",
        value: `${blitzEmote} for Blitz\n${guestEmote} for Guest if you don't play WoT`
      }
    ],
    footer: {
      text: "If you don’t react after 5 minutes, you will be automatically assigned Guest role and have limited access to the server."
    }
  }}).then(message => {
    var timeout = setTimeout(() => {
      member.addRole(role.guest);
      return message.channel.send({embed: {
        color: 15535630,
        title: 'Authentication timeout.',
        description: 'Your have been automatically given Guest role due to inactivity.\nIf you want to connect your Wargaming account, react with ✅, Message will be deleted after 2 minutes.'
      }}).then(message => {
        message.react('✅');
        message.awaitReactions(reaction => {
          if (reaction.count < 1) {
            if (reaction._emoji.name == '✅') {
              message.delete();
              authenticate(member);
            }
          }
        },{
          time: 120000,
          errors: ['time']
        }).catch(err => {
          if (err) {
            message.delete();
            message.channel.send("Timed out. Do" + ` ${prefix}update-auth to re-authenticate!`);
          }
        });
      });
    },300000);
    message.react(euEmote).then(() => {
      message.react(naEmote).then(() => {
        message.react(ruEmote).then(() => {
          message.react(asiaEmote).then(() => {
            message.react(xboxEmote).then(() => {
              message.react(psEmote).then(() => {
                message.react(blitzEmote).then(() => {
                  message.react(guestEmote);
                })
              });
            });
          });
        });
      });
    });
    var region;
    message.awaitReactions(reaction => {
      if (reaction.count > 1) {
        message.channel.send("Please wait...");
        message.delete();
        clearTimeout(timeout);
        if (reaction._emoji == euEmote) {
          region = "EU (PC)";
          domain = 'eu';
        } else if (reaction._emoji == naEmote) {
          region = "NA (PC)";
          domain = 'com';
        } else if (reaction._emoji == ruEmote) {
          region = "RU (PC)";
          domain = 'ru';
        } else if (reaction._emoji == asiaEmote) {
          region = "ASIA (PC)";
          domain = 'asia';
        } else if (reaction._emoji == xboxEmote) {
          region = "XBOX (Console)";
          domain = 'api-xbox-console';
        } else if (reaction._emoji == psEmote) {
          region = "PLAYSTATION (Console)";
          domain = "api-ps4-console";
        } else if (reaction._emoji == blitzEmote) {
          message.channel.send({embed: {
            title: "Your region is now: Blitz",
            color: 1039662,
            description: "Please type your nickname in Blitz."
          }}).then(message => {
            message.channel.awaitMessages(mess => {
              return mess.content.length > 1
            }, {
                max: 1,
                time: 10000,
                error: ['time']
              }
            ).then(col => {
              const content = col.first().content;
              member.addRole(role.blitz);
              if (content.includes(' ')) {
                return message.channel.send("Invalid nickname");
              } else {
                member.addRole(role.blitz);
                member.setNickname(content).catch(err => {
                  if (err) {
                    return message.channel.send({embed: {
                      title: "Error changing nickname!",
                      description: "Nickname is too long or bot doesn't have nicknaming permissions.",
                      color: 15535630
                    }});
                  }
                });
                message.channel.send({embed: {
                  title: "You are all set!",
                  color: 1039662,
                  description: `**You have successfully connected your Wargaming account!**\nYour nickname on server: **${content}**\nYour region role: **Blitz**`,
                  fields: [
                    {
                      name: "Optional commands:",
                      value: "**!n**: Add/edit your nickname\n**!clan**: Show/hide your in-game clan tag\n**!update-clan**: Update your clan tag"
                    }
                  ]
                }});
                if (member.roles.exists('id', role.guest)) return member.removeRole(role.guest, "Had Authenticated!");
              }
            });
          });
          exit = true;
        } else if (reaction._emoji == guestEmote) {
          if (member.roles.array()[1]) return member.send("You already have a role!");
          member.addRole(role.guest);
          exit = true;
          message.channel.send({embed: {
            title: "Guest role assigned!",
            color: 1039662,
            description: 'If you want to connect your Wargaming account, react with ✅',
          }}).then(message => {
            message.react('✅')
            message.awaitReactions(reaction => {
              if (reaction.count > 1) {
                if (reaction._emoji.name == '✅') {
                  message.delete();
                  authenticate(member);
                }
              }
            });
          });
        }
        if (exit) return;
        var url = '';
        const receive = 'https://mousey-maus.herokuapp.com/';
        if (region == "XBOX (Console)" || region == "PLAYSTATION (Console)") {
          url = `https://${domain}.worldoftanks.com/wotx/auth/login/?application_id=${wgAPI}&nofollow=1&redirect_uri=${receive}`;
        } else {
          url = `https://api.worldoftanks.${domain}/wot/auth/login/?application_id=${wgAPI}&nofollow=1&redirect_uri=${receive}`;
        }
        snek.get(url)
        .then(res => {
          googl.shorten(JSON.parse(res.text).data.location)
          .then(res => {
            const link = res;
            member.send({embed: {
              title: `**${region}** chosen as main region.`,
              color: 1039662,
              description: `[__**Click here**__](${link}) to connect to your Wargaming ${region} account!\nIf you choose wrong region, react with ❌ to return to selection.`,
              footer: {
                text: "Note: We are using Wargaming’s official API and therefore have no access to your login or personal info."
              }
            }}).then(message => {
              message.react('❌');
              message.awaitReactions(reaction => {
                if(reaction.count > 1) {
                  if (reaction._emoji.name == '❌') {
                    message.delete();
                    clearInterval(check);
                    authenticate(member);
                  }
                }
              },{
                time: 12000,
                errors: ['time']
              }).catch(err => {
                if (err) return message.channel.send('Request timed out!');
              });
            });
          })
          .catch(err => {
            console.log(err);
          });
        });
      }
      if (informations !== '/') {
        const nick = informations.substring(informations.indexOf('nickname=') + 9, informations.indexOf('&',informations.indexOf('nickname=')));
        const accToken = informations.substring(informations.indexOf('access_token=') + 13, informations.indexOf('&',informations.indexOf('access_token=')));
        const accId = informations.substring(informations.indexOf('account_id=') + 11, informations.indexOf('&',informations.indexOf('account_id=')));
        authCheck(nick,domain,accID,accToken);
        setTimeout(() => {
          if (returnStatement) {
            if (domain == 'eu') {
              member.addRole(role.eu);
            } else if (domain == 'com') {
              member.addRole(role.na);
            } else if (domain == 'ru') {
              member.addRole(role.ru);
            } else if (domain == 'asia') {
              member.addRole(role.asia);
            } else if (domain == 'api-xbox-console') {
              member.addRole(role.xbox);
            } else if (domain == 'api-ps4-console') {
              member.addRole(role.playstation);
            }
            member.setNickname(nick).catch(err => {
              if (err) {
                return message.channel.send({embed: {
                  title: "Error changing nickname!",
                  description: "Nickname is too long or bot doesn't have nicknaming permissions.",
                  color: 15535630
                }});
              }
            });
            return member.send({embed: {
              color: 1039662,
              title: "You are all set!",
              description: `**You have successfully connected your Wargaming account!**\nYour nickname on server: **${nick}**\nYour region role: **${region}**`,
              fields: [
                {
                  name: "Optional commands:",
                  value: "**!n**: Add/edit your nickname\n**!clan**: Show/hide your in-game clan tag\n**!update-clan**: Update your clan tag"
                }
              ]
            }});
            if (member.roles.exists('id', role.guest)) return member.removeRole(role.guest, "Had Authenticated!");
          } else {
            return member.send({embed: {
              title: "Error! This is not your nickname!",
              description: "Please stop trying to break my bot or have a fake nickname!",
              color: 15535630
            }});
          }
        },1000);
      }
    },{
      time: 300000,
      errors: ['time']
    }).catch(err);
  });
}
