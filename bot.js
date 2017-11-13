const discord = require('discord.js');
const fs = require('fs');
const snek = require('snekfetch');
const config = JSON.parse(fs.readFileSync('./settings.json'));
const sqlite = require('sqlite3').verbose();
const htmltojson = require('html-to-json');

const prefix = config.prefix
const db = new sqlite.Database('data');
const client = new discord.Client();
const news = fs.readFileSync('news.txt', 'utf-8');

client.login(config.token);

client.on("ready", function() {
  console.log(`${client.user.username} is ready!`);
  setInterval(() => {
    snek.get('https://thearmoredpatrol.com/category/world-of-tanks/')
    .then(res => {
      htmltojson.parse(res.text, function() {
        return this.map('h1', function($item) {
          return $item.text();
        });
      }).done(function(items) {
        const title = items[1];
        htmltojson.parse(res.text, function() {
          return this.map('article', function($item) {
            return $item.text();
          });
        }).done(function(item) {
          var desc = item[0].replace(/\t/g,'');
          desc = desc.substring(desc.indexOf(title) + title.length, desc.indexOf('Continue reading')).split('\n');
          desc = desc.filter(function(entry) {
            return entry.trim() !== '';
          });
          desc = desc.slice(1).join('\n');
          var promise = htmltojson.request('https://thearmoredpatrol.com/category/world-of-tanks/', {
            'images': ['img', function ($img) {
              return $img.attr('src');
            }]
          }, function (err, result) {
            image = result.images[1];
            if (news.includes(title)) return;
            if (news.includes(image)) return image = 'https://i.imgur.com/VgLcA06.png'
            fs.writeFileSync('./news.txt', `${title}|${image}`);
            client.guilds.get('366915317496152075').channels.get('366949235545079818').send({embed: {
              color: 8242912,
              image: {
                url: image
              },
              title: `__${title}__`,
              description: desc + `\n\n[Read More](https://thearmoredpatrol.com/category/world-of-tanks/)`
            }});
            });
          });
        });
      });
  },300000);
});

client.on("message", function(message) {

});
