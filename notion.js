const { Client } = require('@notionhq/client');
require('dotenv').config();
const notionToken = process.env.NOTION_TOKEN;
const notionUsersDatabaseId = process.env.NOTION_USERS_DATABASE_ID;
const notionGroupsDatabaseId = process.env.NOTION_GROUPS_DATABASE_ID;

const notion = new Client({
    auth: notionToken,
});

module.exports = {

    userTypeById: async discordId => {
        const response = await notion.databases.query({
            database_id: notionUsersDatabaseId,
            filter: {
                'property': 'DiscordId',
                'rich_text': {
                    'equals': discordId,
                },
            },
        });
        if (response.results.length === 1) {
            return response.results[0].properties.IsCustomer.formula.boolean ? 1 : 0;
        }
        return false;
    },

    createUser: async (discordId, discordUsername) => {
        if (await module.exports.findById(discordId) !== -1) {
            return 400;
        }
        await notion.pages.create({
            parent: { database_id: notionUsersDatabaseId },
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

    findById: async discordId => {
        const response = await notion.databases.query({
            database_id: notionUsersDatabaseId,
            filter: {
                'property': 'DiscordId',
                'rich_text': {
                    'equals': discordId,
                },
            },
        });
        if (response.results.length === 1) {
            return {
                id: discordId,
                username: response.results[0].properties.DiscordUsername.title[0].plain_text,
            };
        }
        return -1;
    },

    getUsersIdsByGroupId: async groupId => {
        const usersInGroupResponse = await notion.databases.query({
            database_id: notionGroupsDatabaseId,
            filter: {
                'property': 'GroupId',
                'rich_text': {
                    'equals': groupId,
                },
            },
        });
        if (usersInGroupResponse.results.length !== 1) return { GroupName: undefined, UsersDiscordIds: [] };
        const usersInGroup = usersInGroupResponse.results[0].properties.Users.relation.map(user => {
            return user.id.replace(/-/ig, '');
        });
        const result = await Promise.all(usersInGroup.map(async (userPageId) => {
            const response = await notion.databases.query({
                database_id: notionUsersDatabaseId,
                filter: {
                    'property': 'RecordId',
                    'rich_text': {
                        'equals': userPageId,
                    },
                },
            });
            return response.results[0].properties.DiscordId.rich_text[0].plain_text;
        }));
        const groupName = usersInGroupResponse.results[0].properties.Name.title[0].plain_text;
        if (result.length === 0) return { GroupName: groupName, UsersDiscordIds: [] };
        return { GroupName: groupName, UsersDiscordIds: result };
    },

    getGroupsByUserId: async discordId => {
        const groupsInUser = await notion.databases.query({
            database_id: notionUsersDatabaseId,
            filter: {
                'property': 'DiscordId',
                'rich_text': {
                    'equals': discordId,
                },
            },
        });
        if (groupsInUser.results.length !== 1) return { UserId: discordId, Username: undefined, Groups: [] };
        const groupsInUserIds = groupsInUser.results[0].properties.Servers.relation.map(group => {
            return group.id.replace(/-/ig, '');
        });
        const result = await Promise.all(groupsInUserIds.map(async (groupPageId) => {
            const response = await notion.databases.query({
                database_id: notionGroupsDatabaseId,
                filter: {
                    'property': 'GroupId',
                    'rich_text': {
                        'equals': groupPageId,
                    },
                },
            });
            return { id: groupPageId, name: response.results[0].properties.Name.title[0].plain_text };
        }));
        if (result.length === 0) return [];
        return result;
    },

};
