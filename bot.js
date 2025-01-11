const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const cron = require('node-cron');
require('dotenv').config();

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;


const TEAM_ID = 1974;
const API_BASE = 'https://api.sofascore.com/api/v1';

async function getNextGame(teamId) {
    try {
        const response = await axios.get(`${API_BASE}/team/${teamId}/events/next/0`);
        if (response.status === 200 && response.data.events && response.data.events.length > 0) {
            const nextEvent = response.data.events[0];
            const tournamentName = nextEvent.tournament.name;
            const homeTeam = nextEvent.homeTeam.name;
            const awayTeam = nextEvent.awayTeam.name;
            const venue = nextEvent.venue?.stadium || 'Local não informado';
            const startTimestamp = nextEvent.startTimestamp;
            const startDate = new Date(startTimestamp * 1000);
            const currentDate = new Date();
            const daysUntilGame = Math.ceil((startDate - currentDate) / (1000 * 60 * 60 * 24));

            return {
                tournamentName,
                homeTeam,
                awayTeam,
                venue,
                startDate,
                daysUntilGame,
                isToday: startDate.toDateString() === currentDate.toDateString(),
            };
        } else {
            return null;
        }
    } catch (error) {
        console.error('Erro ao buscar informações do próximo jogo:', error.message);
        return null;
    }
}


const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', () => {
    console.log(`Bot está online como ${client.user.tag}!`);

    cron.schedule('0 12 * * *', async () => {
        const channel = client.channels.cache.find(channel => channel.name === 'geral'); // Substitua pelo nome do canal desejado
        if (channel) {
            const game = await getNextGame(TEAM_ID);
            if (game) {
                if (game.isToday) {
                    channel.send(
                        `🔥 **Hoje tem jogo do Gigante!**\n🏆 **Campeonato:** ${game.tournamentName}\n⚔️ **Contra:** ${
                            game.awayTeam === 'Vasco da Gama' ? game.homeTeam : game.awayTeam
                        }\n⏰ **Horário:** ${game.startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n📍 **Local:** ${game.venue}`
                    );
                } else {
                    channel.send(
                        `⚽ **Próximo jogo do Vasco:**\n🏆 **Campeonato:** ${game.tournamentName}\n🏠 **Time da Casa:** ${game.homeTeam}\n🛫 **Time Visitante:** ${game.awayTeam}\n📍 **Local:** ${game.venue}\n⏰ **Horário:** ${game.startDate.toLocaleString()}\n📅 **Dias Restantes:** ${game.daysUntilGame} dia(s)`
                    );
                }
            } else {
                channel.send('Nenhum jogo encontrado para o Vasco.');
            }
        }
    });

    cron.schedule('* * * * *', async () => {
        const game = await getNextGame(TEAM_ID);
        const currentDate = new Date();
        if (game && game.startDate.toLocaleString() === currentDate.toLocaleString()) {
            const channel = client.channels.cache.find(channel => channel.name === 'geral'); // Substitua pelo nome do canal desejado
            if (channel) {
                channel.send(
                    `🚨 **Atenção torcida!** O jogo do Vasco começou agora!\n🏆 **Campeonato:** ${game.tournamentName}\n⚔️ **Adversário:** ${
                        game.awayTeam === 'Vasco da Gama' ? game.homeTeam : game.awayTeam
                    }\n📍 **Local:** ${game.venue}`
                );
            }
        }
    });

    console.log('Tarefas agendadas para mensagens diárias e alertas de jogo.');
});


client.on('messageCreate', async (message) => {
    if (message.content.toLowerCase() === '!vasco') {
        const game = await getNextGame(TEAM_ID);
        if (game) {
            if (game.isToday) {
                message.channel.send(
                    `🔥 **Hoje tem jogo do Gigante!**\n🏆 **Campeonato:** ${game.tournamentName}\n⚔️ **Contra:** ${
                        game.awayTeam === 'Vasco da Gama' ? game.homeTeam : game.awayTeam
                    }\n⏰ **Horário:** ${game.startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n📍 **Local:** ${game.venue}`
                );
            } else {
                message.channel.send(
                    `⚽ **Próximo jogo do Vasco:**\n🏆 **Campeonato:** ${game.tournamentName}\n🏠 **Time da Casa:** ${game.homeTeam}\n🛫 **Time Visitante:** ${game.awayTeam}\n📍 **Local:** ${game.venue}\n⏰ **Horário:** ${game.startDate.toLocaleString()}\n📅 **Dias Restantes:** ${game.daysUntilGame} dia(s)`
                );
            }
        } else {
            message.channel.send('Nenhum jogo encontrado para o Vasco.');
        }
    }
});

client.login(DISCORD_TOKEN);

