const { Client } = require("@notionhq/client");
require('dotenv').config();
const usersDatabaseId = process.env.NOTION_USER_DATABASE_ID;
const groupsDatabaseId = process.env.NOTION_GROUPS_DATABASE_ID;

const notion = new Client({
    auth: process.env.NOTION_TOKEN,
});

module.exports = {

    userTypeById: async function(customerId) {
        const response = await notion.databases.query({
            database_id: usersDatabaseId,
            filter:{
                'property': 'DiscordId',
                'rich_text': {
                    'equals': customerId,
                },
            },
        });
        if (response.results.length === 1) {
            return response.results[0].properties.IsCustomer.formula.boolean ? 1 : 0;
        }
        return false;
    },

    createUser: async function(discordId, discordUsername) {
        if (await this.findById(discordId) !== -1) {
            return 400;
        }
        await notion.pages.create({
            parent: { database_id: usersDatabaseId },
            properties: {
                DiscordUsername: {
                    title: [
                        {
                            text: {
                                content: discordUsername,
                            },
                        },
                    ],
                },
                DiscordId: {
                    rich_text: [
                        {
                            text: {
                                content: discordId,
                            },
                        },
                    ],
                },
            },
        });
        return { id: discordId, discordId: discordId, username: discordUsername };
    },

    findById: async function(discordId) {
        const response = await notion.databases.query({
            database_id: usersDatabaseId,
            filter:{
                'property': 'DiscordId',
                'rich_text': {
                    'equals': discordId,
                },
            },
        });
        if (response.results.length === 1) {
            return {
                id: response.results[0].properties.DiscordId.rich_text[0].plain_text,
                discordId: response.results[0].properties.DiscordId.rich_text[0].plain_text,
                username:response.results[0].properties.DiscordUsername.title[0].plain_text,
            };
        }
        return -1;
    },

    getUsersIdsByGroupId: async function(groupId) {
        const usersInGroupResponse = await notion.databases.query({
            database_id: groupsDatabaseId,
            filter:{
                'property': 'GroupId',
                'rich_text': {
                    'equals': groupId,
                },
            },
        });
        if (usersInGroupResponse.results.length !== 1) return { GroupName: undefined,  UsersDiscordIds: [] };
        const usersInGroup = usersInGroupResponse.results[0].properties.Users.relation.map(user => {
            return user.id.replace(/-/ig, '');
        })
        const result = await await Promise.all(usersInGroup.map( async(userPageId) => {
            const response = await notion.databases.query({
                database_id: usersDatabaseId,
                filter:{
                    'property': 'RecordId',
                    'rich_text': {
                        'equals': userPageId,
                    },
                },
            });
            return await response.results[0].properties.DiscordId.rich_text[0].plain_text
        }))
        const groupName = usersInGroupResponse.results[0].properties.Name.title[0].plain_text;
        if (result.length == 0) return { GroupName: groupName, UsersDiscordIds: []}
        return { GroupName: groupName, UsersDiscordIds: await result}
    },
};
