const discord = require('discord.js');
const snek = require('snekfetch');
const fs = require('fs');
const client = new discord.Client();
const requestbin = require('requestbin');
const googl = require('goo.gl');

const config = JSON.parse(fs.readFileSync('./settings.json'));
const role = JSON.parse(fs.readFileSync('./role.json'));
const emoji = JSON.parse(fs.readFileSync('./emoji.json'));
const prefix = config.prefix;
const wgAPI = config.wgApi;

client.login(config.token);
googl.setKey(config.google);

const allRole = [role.eu,role.na,role.ru,role.asia,role.xbox,role.playstation,role.blitz];
var nick;
var accID;
var accToken;

client.on('ready', function() {
  process.setMaxListeners(5);
  console.log('This bot is ready!');
  client.user.setGame(`DM: ${prefix}help`);
});

client.on('guildMemberAdd', function(user) {
  authenticate(user);
});

process.on('error', err => {
  console.log(err);
  return;
});

process.on('unhandledRejection', (err) => {
  return;
});

client.on('message', function(message) { //Message event!
  if (!message.content.startsWith(prefix)) return;
  if(message.author.id == client.user.id) return;
  const mess = message.content.toLowerCase();
  message.delete();
  if (mess.startsWith(prefix + 'n')) { //When a user change nickname
    const nick = message.content.split(' ').slice(1).join(' ');
    if (nick.length == 0) {
      message.member.setNickname(message.member.displayName.split(' |').slice(0,1).join('')).catch(err => {
        if (err) {
          clearTimeout(success);
          return message.channel.send({embed: {
            title: "Error changing nickname!",
            description: "Nickname is too long or bot doesn't have nicknaming permissions.",
            color: 15535630
          }});
        }
      });
      const success = setTimeout(() => {
        message.channel.send({embed: {
          color: 1039662,
          title: "Your nickname has been reset!",
          description: `New nickname: ${message.member.displayName.split(' |').slice(0,1).join('')}`
        }});
      },300);
      return;
    }
    if (message.guild == null) return message.channel.send("Please command me in a guild I'm in");
    if (message.member.roles.exists("id", role.guest)) {
      message.member.setNickname(nick).catch(err => {
        if (err) {
          clearTimeout(success);
          return message.channel.send({embed: {
            title: "Error changing nickname!",
            description: "Nickname is too long or bot doesn't have nicknaming permissions.",
            color: 15535630
          }});
        }
      });
      const success = setTimeout(() => {
        return message.channel.send({embed: {
          title: "Success!",
          color: 1039662,
          description: `New Nickname: ${nick}`
        }});
      });
      return;
    }
    const name = `${message.member.displayName.split(' |').slice(0,1).join('')} | ${nick}`;
    message.member.setNickname(name)
    .catch(err => {
      if (err) {
        clearTimeout(success);
        return message.channel.send({embed: {
          title: "Error changing nickname!",
          color: 15535630,
          description: "Nickname is too long or bot doesn't have nicknaming permissions.",
          color: 15535630
        }});
      }
    });
    const success = setTimeout(() => {
      message.channel.send({embed: {
        color: 1039662,
        title: "Success!",
        description: `New nickname: ${name}`
      }});
    },300);
  } else if (mess.startsWith(prefix + 'clan')) { //When a user do clan command
    if (message.guild == null) return message.channel.send("Please command me in a guild I'm in");
    if (message.member.roles.exists("id", role.guest)) return message.channel.send({embed: {
      title: "Error!",
      color: 15535630,
      description: "This command can't be used as Guest"
    }});
    clan(message);
  } else if (mess.startsWith(prefix + 'update-clan')) { //When a user update clan
    if (message.guild == null) return message.channel.send("Please command me in a guild I'm in");
    if (message.member.roles.exists("id", role.guest)) return message.channel.send({embed: {
      title: "Error!",
      color: 15535630,
      description: "This command can't be used as Guest"
    }});
    message.member.setNickname(message.member.displayName.replace(/\[[^\]]*\]/,'')).catch(err => {
      if (err) {
        return message.channel.send({embed: {
          title: "Error changing nickname!",
          description: "Nickname is too long or bot doesn't have nicknaming permissions.",
          color: 15535630
        }});
      }
    });
    clan(message);
  } else if (mess.startsWith(prefix + 'update-auth')) { //When a user update authentication
    if (message.guild == null) return message.channel.send("Please command me in a guild I'm in");
    authenticate(message.member);
    message.channel.send(`<@${message.author.id}>, please check your DM.`);
  } else if (mess.startsWith(prefix + 'help')) { //when a user does the help command
    message.channel.send(`<@${message.author.id}>, please check your DM.`);
    message.author.send({embed: {
      color: 1039662,
      fields: [
        {
          name: "__Nickname Related:__",
          value: `**${prefix}n**: Add/edit your nickname\n**${prefix}clan**: Show/hide your in-game clan tag\n**${prefix}update-clan**: Update your clan tag`
        },
        {
          name: "__Authentication Related:__",
          value: `**${prefix}update-auth**: Re-authenticate in case you've changed your in-game name.\n**${prefix}role**: Edit the roles you have.`
        },
        {
          name: "__Admit Related__",
          value: `**${prefix}purge [Num]**: Delete messages in that channel.`
        }
      ]
    }});
  } else if (mess.startsWith(prefix + 'purge')) {
    if (message.guild == null) return message.channel.send("Please command me in a guild I'm in");
    if (!message.member.hasPermission("ADMINISTRATOR")) return;
    const input = message.content.split(' ').slice(1)[0];
    message.channel.bulkDelete(input);
    const member = message.member;
  } else if (mess.startsWith(prefix + 'role')) { //When a user want to edit their role
    if (message.member.roles.exists("id", role.guest)) return message.channel.send({embed: {
      title: "Error!",
      color: 15535630,
      description: "This command can't be used as Guest"
    }});
    if (message.member.roles.array().length < 2) {
      return message.channel.send({embed: {
        title: "Error!",
        color: 15535630,
        description: "Please authenticate before using `" + prefix + "role`!"
      }});
    }
    const member = message.member;
    message.channel.send({embed: {
      title: "Decide what to do with your roles:",
      color: 1039662,
      description: "React: ➕ to **add** roles.\nReact: ➖ to **remove** roles.\nReact ❌ to exit."
    }}).then(message => {
      message.react('➕').then(() => {
        message.react('➖').then(() => {
          message.react('❌');
        });
      });
      message.awaitReactions(reaction => {
        if (reaction.count > 1) {
          message.delete();
          if (reaction._emoji.name == '➕') {
            const roles = member.roles.array();
            var roleID = [];
            roles.map(ele => {
              roleID.push(ele.id);
            });
            const available = allRole.filter(val => {return !roleID.includes(val)});
            const avaName = [];
            available.map(ele => {
              avaName.push(roleName(ele));
            });
            message.channel.send({embed: {
              title: "What role do you want to add?",
              color: 1039662,
              description: `Available role(s): **${avaName.join("**, **")}**`
            }}).then(message => {
              var i = 0
              avaName.map(ele => {
                message.react(emojiFunc(ele)).then(() => {
                  i++
                  if (i == avaName.length) {
                    message.react('❌');
                  }
                });
              });

              message.awaitReactions(reaction => {
                if (reaction.count > 1) {
                  message.delete();
                  if (reaction._emoji.id == emoji.eu) {
                    member.addRole(role.eu);
                  } else if (reaction._emoji.id == emoji.na) {
                    member.addRole(role.na);
                  } else if (reaction._emoji.id  == emoji.ru) {
                    member.addRole(role.ru);
                  } else if (reaction._emoji.id == emoji.asia) {
                    member.addRole(role.asia);
                  } else if (reaction._emoji.id == emoji.xbox) {
                    member.addRole(role.xbox);
                  } else if (reaction._emoji.id == emoji.ps) {
                    member.addRole(role.playstation);
                  } else if (reaction._emoji.id == emoji.blitz) {
                    member.addRole(role.blitz);
                  } else if (reaction._emoji.name == '❌') return;
                }
              });
            });
          } else if (reaction._emoji.name == '➖') {
            const roles = member.roles.array();
            var roleID = [];
            roles.map(ele => {
              roleID.push(ele.id);
            });
            var avaName = [];
            roleID.map(ele => {
              avaName.push(roleName(ele));
            });
            avaName = avaName.filter(ele => {return ele !== undefined});
            message.channel.send({embed: {
              title: "What role do you want to remove?",
              color: 1039662,
              description: `Available role(s): **${avaName.join("**, **")}**`
            }}).then(message => {
              var i = 0;
              avaName.map(ele => {
                message.react(emojiFunc(ele)).then(() => {
                  i++;
                  if (i == avaName.length) {
                    message.react('❌');
                  }
                });
              });
              message.awaitReactions(reaction => {
                if (reaction.count > 1) {
                  message.delete();
                  if (reaction._emoji.id == emoji.eu) {
                    member.removeRole(role.eu);
                  } else if (reaction._emoji.id == emoji.na) {
                    member.removeRole(role.na);
                  } else if (reaction._emoji.id  == emoji.ru) {
                    member.removeRole(role.ru);
                  } else if (reaction._emoji.id == emoji.asia) {
                    member.removeRole(role.asia);
                  } else if (reaction._emoji.id == emoji.xbox) {
                    member.removeRole(role.xbox);
                  } else if (reaction._emoji.id == emoji.ps) {
                    member.removeRole(role.playstation);
                  } else if (reaction._emoji.id == emoji.blitz) {
                    member.removeRole(role.blitz);
                  } else if (reaction._emoji.name == '❌') return;
                }
              });
            });
          } else if (reaction._emoji.name == '❌') return;
        }
      });
    });
  } else if (mess.startsWith(prefix + 'test')) {
    message.member.send('Test OK');
  }
});

//Check domain for server link
function domain(region) {
  if (region == 'eu') return 'EU';
  if (region == 'na') return 'US';
  if (region == 'ru') return 'RU';
  if (region == 'asia') return 'SEA';
  return false;
}

//Hide or show clan tag
function clan (message) {
  if (message.member.displayName.split('|').slice(0,1).join('').includes('[')) {
    message.member.setNickname(message.member.displayName.replace(/\[[^\]]*\]/,'')).catch(err => {
      if (err) {
        clearTimeout(success);
        return message.channel.send({embed: {
          title: "Error changing nickname!",
          description: "Nickname is too long or bot doesn't have nicknaming permissions.",
          color: 15535630
        }});
      }
    });
    const success = setTimeout(() => {
      message.channel.send({embed: {
        title: "Success!",
        description: `${message.member.displayName}, clan tag hidden.`,
        color: 1039662
      }});
    },300);
  } else {
    const name = message.member.displayName.split(' ').slice(0,1).join('');
    const id = message.author.id;
    const roles = message.member.roles.array().slice(0,4);
    var region = [];
    const regionName = [];
    const roleArr = Object.entries(role);
    roles.map(ele => {
      region.push(ele.id);
    });
    region = region.slice(1);
    roleArr.map(eleRole => {
      region.map(regRole => {
        if(eleRole.includes(regRole)) {
          regionName.push(eleRole[0]);
        }
      });
    });
    if (regionName.length == 1) {
      if (!domain(regionName[0])) return message.channel.send("Error! You can't have a clan on console or blitz");
      snek.get(`http://www.wotinfo.net/en/efficiency?server=${domain(regionName[0])}&playername=${name}`)
      .then(res => {
        const text = res.text.substring(res.text.indexOf('clanoverview'),res.text.indexOf('clanoverview') + 50);
        const clan = text.match(/\>[^\<]*\</)[0].replace('>','[').replace('<',']');
        if (clan.replace('\n','') == '[]') return message.channel.send("You are not in a clan!");
        var nickname = message.member.displayName.split(' ');
        nickname.splice(1,0,clan);
        nickname = nickname.filter(ele => {return ele !== ''});
        nickname = nickname.join(' ');
        message.member.setNickname(nickname).catch(err => {
          if (err) {
            clearTimeout(success);
            return message.channel.send({embed: {
              title: "Error changing nickname!",
              description: "Nickname is too long or bot doesn't have nicknaming permissions.",
              color: 15535630
            }});
          }
        });
        const success = setTimeout(() => {
          message.channel.send({embed: {
            title: "Success!",
            color: 1039662,
            description: `New nickname: ${nickname}`
          }});
        },300);
      });
      return;
    }
    message.channel.send({embed: {
      color: 1039662,
      title: "Please type your clan's region.",
      description: `Available regions: **${regionName.join('**, **').toUpperCase()}**`,
      footer: {
        text: 'Request will timeout after 1 minute.'
      }
    }}).then(message => {
      message.channel.awaitMessages(input => {
        return input.author.id == id;
      }, {
        max: 1,
        time: 60000,
        error: ['time']
      })
      .then(input => {
        const region = input.first().content.toLowerCase();
        const name = input.first().member.displayName.split(' ').slice(0,1);
        if (!domain(regionName[0])) return message.channel.send('Invalid region!');
        snek.get(`http://www.wotinfo.net/en/efficiency?server=${domain(region)}&playername=${name}`)
        .then(res => {
          const text = res.text.substring(res.text.indexOf('clanoverview'),res.text.indexOf('clanoverview') + 50);
          const clan = text.match(/\>[^\<]*\</)[0].replace('>','[').replace('<',']');
          if (clan.replace('\n','') == '[]') return message.channel.send("You are not in a clan!");
          var nickname = input.first().member.displayName.split(' ');
          nickname.splice(1,0,clan);
          nickname = nickname.filter(ele => {return ele !== ''});
          nickname = nickname.join(' ');
          if (nickname.replace('[','').replace(']','') == '') return message.channel.send("You are not in a clan!");
          input.first().member.setNickname(nickname).catch(err => {
            if (err) {
              clearTimeout(success);
              return message.channel.send({embed: {
                title: "Error changing nickname!",
                description: "Nickname is too long or bot doesn't have nicknaming permissions.",
                color: 15535630
              }});
            }
          });
          const success = setTimeout(() => {
            message.channel.send({embed: {
              title: "Success!",
              color: 1039662,
              description: `Your new name is now: ${nickname}`
            }});
          },300);
        });
        return;
      })
      .catch(err => {
        return message.channel.send('Request timed out!');
      });
    });
  }
}

function authenticate(member) {
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
        description: 'Your have been automatically given Guest role due to inactivity.\nIf you want to connect your Wargaming account, react with ✅'
      }}).then(message => {
        message.react('✅');
        message.awaitReactions(reaction => {
          if (reaction.count < 1) {
            if (reaction._emoji.name == '✅') {
              message.delete();
              authenticate(member);
            }
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
    var domain;
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
        requestbin.create(false,function(err,data) {
          if (err) {
            return console.log(err);
          }
          const receive = `https://requestb.in/${data.name}`;
          if (region == "XBOX (Console)" || region == "PLAYSTATION (Console)") {
            url = `https://${domain}.worldoftanks.com/wotx/auth/login/?application_id=${wgAPI}&nofollow=1&redirect_uri=${receive}`;
          } else {
            url = `https://api.worldoftanks.${domain}/wot/auth/login/?application_id=${wgAPI}&nofollow=1&redirect_uri=${receive}`;
            console.log(receive + '?&status=ok&access_token=2df537ceb5b9d1e3d81fd37ba5fe57a4798b6d65&nickname=Forcellrus&account_id=518552414&expires_at=1512554742');
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
                });
              });
            })
            .catch(err => {
              console.log(err);
            });
            var i = 0;
            const check = setInterval(() => {
              i++
              if (i > 150) {
                clearInterval(check);
                member.addRole(role.guest);
                return member.send({embed: {
                  title: "Authentication timeout.",
                  color: 15535630,
                  description: "You have been given Guest role automatically due to inactivity.\nPlease type `!update-auth` to re-authenticate."
                }});
              }
              snek.get(`${receive}?inspect`)
              .then(res => {
                if(res.text.includes('GET')) {
                  clearInterval(check);
                  if(res.text.indexOf('nickname=') < 0) {
                    member.addRole(role.guest);
                    return member.send({
                      title: "Authentication failed.",
                      color: 15535630,
                      description: "You have been given Guest role automatically.\nPlease rejoin the server to re-authenticate."
                    });
                  } else {
                    nick = res.text.substring(res.text.indexOf('nickname=') + 9, res.text.indexOf('nickname=') + 39).replace('</span>','');
                    nick = nick.split('&').slice(0,1).join('');
                    accToken = res.text.substring(res.text.indexOf('access_token=') + 13,res.text.indexOf('access_token=') + 60);
                    accToken = accToken.split('&').slice(0,1).join('');
                    accID = res.text.substring(res.text.indexOf('account_id=') + 11,res.text.indexOf('account_id=') + 20);
                    accID = accID.split('&').slice(0,1).join('');
                    authCheck(nick,domain,accID,accToken);
                    setTimeout(() => {
                      if (returnStatement) {
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
                        if (member.roles.exists('id', role.guest)) return member.removeRole(role.guest, "Had Authenticated!");
                        member.setNickname(nick).catch(err => {
                          if (err) {
                            return message.channel.send({embed: {
                              title: "Error changing nickname!",
                              description: "Nickname is too long or bot doesn't have nicknaming permissions.",
                              color: 15535630
                            }});
                          }
                        });
                      } else {
                        return member.send({embed: {
                          title: "Error! This is not your nickname!",
                          description: "Please stop trying to break my bot or have a fake nickname!",
                          color: 15535630
                        }});
                      }
                    },500);
                  }
                }
              });
            },2000);
          });
        });
      }
    });
  });
}

//Change role id into name function
function roleName (id) {
  if (id == role.eu) return "EU";
  if (id == role.na) return "NA";
  if (id == role.ru) return "RU";
  if (id == role.asia) return "ASIA";
  if (id == role.xbox) return "Xbox";
  if (id == role.playstation) return "Playstation";
  if (id == role.blitz) return "Blitz";
}

//emoji with role name
function emojiFunc(name) {
  const euEmote = client.emojis.get(emoji.eu);
  const naEmote = client.emojis.get(emoji.na);
  const ruEmote = client.emojis.get(emoji.ru);
  const asiaEmote = client.emojis.get(emoji.asia);
  const xboxEmote = client.emojis.get(emoji.xbox);
  const psEmote = client.emojis.get(emoji.ps);
  const blitzEmote = client.emojis.get(emoji.blitz);
  if (name == "EU") return euEmote;
  if (name == "NA") return naEmote;
  if (name == "RU") return ruEmote;
  if (name == "ASIA") return asiaEmote;
  if (name == "Xbox") return xboxEmote;
  if (name == "Playstation") return psEmote;
  if (name == "Blitz") return blitzEmote;
}

//Check if authentic
var returnStatement;
function authCheck(nickname, domain, accID, accToken) {
  var url;
  if (domain == 'api-xbox-console' || domain == 'api-ps4-console') {
    url = `https://${domain}.worldoftanks.com/wotx/account/info/?application_id=${wgAPI}&access_token=${accToken}&account_id=${accID}`;
  } else {
    url = `https://api.worldoftanks.${domain}/wot/account/info/?application_id=${wgAPI}&access_token=${accToken}&account_id=${accID}`;
  }
  snek.get(url).then(res => {
    const user = JSON.parse(res.text);
    if (user.data[accID].nickname !== nickname) return returnStatement = false;
    if (user.data[accID].private == null) return returnStatement = false;
    if (user.error) return returnStatement = false;
    return returnStatement = true;
  });
}
