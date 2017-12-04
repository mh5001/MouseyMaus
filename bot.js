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
var domain;

eval(fs.readFileSync('./auth.js', 'utf-8'));

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
  if (mess.startsWith(prefix + 'n')) { //When a user change nickname
    const nick = message.content.split(' ').slice(1).join(' ');
    if (message.guild == null) return message.channel.send("Please command me in a guild I'm in");
    if (nick.length == 0) {
      setName(message.member,message.member.displayName.split(' |').slice(0,1).join(''),message.channel);
      return;
    }
    if (nick.match(/\w|\ /g) == null) return message.channel.send({embed: {
      color: 15535630,
      title : 'Invalid Nickname!',
      description: "Your nickname can only consist of Latin characters, numbers, and underscores. This also applies to Guests."
    }});
    if (nick.match(/\w|\ /g).length !== nick.split('').length) return message.channel.send({embed: {
      color: 15535630,
      title : 'Invalid Nickname!',
      description: "Your nickname can only consist of Latin characters, numbers, and underscores. This also applies to Guests."
    }});
    if (message.member.roles.exists("id", role.guest)) {
      setName(message.member,nick,message.channel);
      return;
    }
    const name = `${message.member.displayName.split('|').slice(0,1).join('').trim()} | ${nick}`;
    setName(message.member,name,message.channel);
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
    setName(message.member,message.member.displayName.replace(/\[[^\]]*\]/,''),message.channel);
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
          name: "__Admin Related__",
          value: `**${prefix}purge [Num]**: Delete messages in that channel.`
        }
      ]
    }});
  } else if (mess.startsWith(prefix + 'purge ')) {
    if (message.guild == null) return message.channel.send("Please command me in a guild I'm in");
    if (!message.member.hasPermission("ADMINISTRATOR")) return;
    const input = message.content.split(' ').slice(1)[0];
    message.channel.bulkDelete(parseInt(input) + 1);
    const member = message.member;
  } else if (mess.startsWith(prefix + 'role')) { //When a user want to edit their role
    if (message.guild == null) return message.channel.send("Please command me in a guild I'm in");
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
    message.member.send({embed: {
      title: "Decide what to do with your roles:",
      color: 1039662,
      description: "React: ➕ to **add** roles.\nReact: ➖ to **remove** roles.\nReact ❌ to cancel."
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
  if (region == 'xbox') return 'XBOX';
  if (region == 'ps') return 'PS4';
  return false;
}

//Hide or show clan tag
function clan (message) {
  if (message.member.displayName.split('|').slice(0,1).join('').includes('[')) {
    const ign = message.member.displayName.split('|').slice(0,1).join('').replace(/\[[^\]]*\]/,'').trim() + ' ';
    const nick = message.member.displayName.split('|').slice(1,2);
    var clearName;
    if (nick.join('').replace(/\s/g,'') == '') {
      clearName = ign;
    } else {
      clearName = ign + "|" + nick;
    }
    clearName = clearName.trim();
    message.member.setNickname(clearName).catch(err => {
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
    const name = message.member.displayName.split('|').slice(0,1).join('').trim();
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
      if (!domain(regionName[0])) return message.channel.send("Error! You can't have a clan on blitz");
      snek.get(`http://www.wotinfo.net/en/efficiency?server=${domain(regionName[0])}&playername=${name}`)
      .then(res => {
        const text = res.text.substring(res.text.indexOf('clanoverview'),res.text.indexOf('clanoverview') + 50);
        const clan = text.match(/\>[^\<]*\</)[0].replace('>','[').replace('<',']');
        if (clan.replace('\n','') == '[]') return message.channel.send("You are not in a clan!");
        var nickname = message.member.displayName.split('|');
        nickname.splice(1,0,clan);
        nickname.splice(2,0,'|');
        nickname = nickname.filter(ele => {return ele !== ''});
        nickname = nickname.join(' ').trim();
        if (nickname.split('|').slice(1).join('') == '') {
          nickname = nickname.split('|').join('').trim();
        }
        nickname = nickname.split(' ');
        nickname = nickname.filter(ele => {return ele !== ""});
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
          var nickname = input.first().member.displayName.split('|');
          nickname.splice(1,0,clan);
          nickname.splice(2,0,'|');
          nickname = nickname.filter(ele => {return ele !== ''});
          nickname = nickname.join(' ').trim();
          if (nickname.split('|').slice(1).join('') == '') {
            nickname = nickname.split('|').join('').trim();
          }
          nickname = nickname.split(' ');
          nickname = nickname.filter(ele => {return ele !== ""});
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

//Set name to member
function setName(member,nick,channel) {
  member.setNickname(nick).catch(err => {
    if (err) {
      clearTimeout(success);
      return channel.send({embed: {
        title: "Error changing nickname!",
        description: "Nickname is too long or bot doesn't have nicknaming permissions.",
        color: 15535630
      }});
    }
  });
  const success = setTimeout(() => {
    channel.send({embed: {
      color: 1039662,
      title: "Your nickname has been changed!",
      description: `New nickname: ${nick}`
    }});
  },300);
}
