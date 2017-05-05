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
    'input/demo': {
        focus: {
            customTracking: {
                id: 'focus demo input'
            }
        },
        input: {
            customTracking: {
                id: 'input demo input',
            }
        },
        blur: {
            customTracking: {
                id: 'blur demo input'
            }
        }
    },
    'input/concurent': {
        focus: {
            customTracking: {
                id: 'focus concurent input'
            }
        },
        input: {
            dataToTrackFn: function(data, event){
                return {
                    customTracking: {
                        id: 'input concurent input'
                    },
                    inputValue: event.target.baseURI.indexOf('localhost') ? event.target.value : event.target.value.length
                };
            }
        },
        blur: {
            customTracking: {
                id: 'blur concurent input'
            }
        }
    },
    'input/password': {
        input: {
            dataToTrackFn: function(data){
                return {
                    customTracking: {
                        id: 'input password input'
                    },
                    inputValue: data.inputValue.length
                };
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
