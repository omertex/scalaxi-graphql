const usersDb = require('../users-db').data;

async function getUserSubordinates(userId) {
    return usersDb.filter(e => { e.managerId === userId });
}

module.exports = {
    getUserSubordinates
}