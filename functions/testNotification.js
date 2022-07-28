const admin = require("firebase-admin");
admin.initializeApp();

const payload = {
    data:{
        "forumId" : "forumId",
        "initiator" : "none",
        "type" : "testNotification",
        "title" : "Test Notification2",
        "text" : " test "
    }
};

admin.messaging().sendToTopic("testNotification",payload);
