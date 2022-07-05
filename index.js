const Notion = require('./notion');

(async () => {
    //console.log(await Notion.getUsersIdsByGroupId('64057f9df71241719b7162265c8bb70f'));
    console.log(await Notion.getGroupsByUserId('889980333292945478'))
})();

