module.exports = {
    'update': {
        click: {
            customTracking: {
                id: 'Update all',
                params: {
                    someParam: 'some param'
                }
            }
        }
    },
    '../res/data/groups.json': {
        success: {
            id: 'Load groups'
        }
    },
    '../res/data/users.json': {
        success: {
            id: 'Load users'
        }
    },
    'user(*)': {
        click: {
            customTracking: {
                id: 'Select user',
                params: {
                    userId: '*'
                }
            }
        }
    },
    'user(*)/more': {
        click: {
            customTracking: {
                id: 'Select user more',
                params: {
                    userId: '*'
                }
            }
        }
    },
    'group(*)/more': {
        click: {
            customTracking: {
                id: 'Select group more',
                params: {
                    groupId: '*'
                }
            }
        }
    },
    'group(*)': {
        click: {
            customTracking: {
                id: 'Select group',
                params: {
                    groupId: '*'
                }
            }
        }
    }
};
