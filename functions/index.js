const functions = require('firebase-functions');
let admin = require("firebase-admin");
admin.initializeApp({
    databaseURL: "https://ganchyas.firebaseio.com"
});
const likeTexts = [
    " thinks your post rocks!",
    " say you're cool",
    " : \"YEAH BOYEEEEE ..\"",
    " says nice post nigga",
    " thinks you have big pp",
    " : xD nice one lol",
    " : YEEEETTT...",
    " likes your forum",
    " : me like",
    " says nice one"
];
const dislikeTexts = [
    " thinks your post was gay",
    " doesnt like your forum",
    " says you have small pp",
    " says you suck",
    " : cringe 100",
    " : y ur post sh*t",
    " says .. bas na",
    " : smol pp",
    " : me no like",
    " : u gay",
];

// send a notification to the topic "allUsers" whenever a new forum is added
exports.sendForumNotification = functions.database.ref('/forumData/{forumId}')
    .onCreate((snapshot, context) => {
        const newForum = snapshot.val();
        const senderId = newForum.sender;
        const topic = "allUsers";
        const type = "newForum";
        const forumId = context.params.forumId;
        return admin.database().ref('/userdata/' + senderId).once('value',(snapshot) =>
        {
            const sender = snapshot.val().name;
            const payload = {
                data:{
                    "forumId" : forumId,
                    "initiator" : senderId,
                    "type" : type,
                    "title" : "New Forum Added",
                    "text" : sender  + " has added a new forum with the subject : \"" + newForum.subject + "\""
                }
            };

            if (newForum.subject === "")
                payload.data.text = sender + " has added a new forum without a subject";

            console.log("forum id:" + context.params.forumId + "\nsenderId : " + senderId + "\nsender : " + sender + "\ntype : " + type + "\ntext : " + payload.data.text);
            return admin.messaging().sendToTopic(topic, payload);

        });
    });

// send a notification to the sender of a forum when a comment is added to it
exports.sendCommentNotification = functions.database.ref('/forumData/{forumId}/comments/{newComment}')
    .onCreate((snapshot, context) => {
        const newComment = snapshot.val();
        const senderId = newComment.sender;
        const topic = context.params.forumId;
        const type = "newComment";
        const forumId = context.params.forumId;
        return admin.database().ref('/userdata/' + senderId).once('value', (snapshot) => {
            const sender = snapshot.val().name;
            const payload = {
                data: {
                    "forumId" : forumId,
                    "initiator": senderId,
                    "type": type,
                    "title": "New Comment",
                    "text": sender + " has commented on your forum : \"" + newComment.text + "\""
                }
            };
            console.log("forum id:" + topic + "\nsenderId : " + senderId + "\nsender : " + sender + "\ntype : " + type + "\nsub-type : " + "comment\n" +
                "text : " + payload.data.text);
            return admin.messaging().sendToTopic(topic, payload);
        });
    });

// send a notification to the sender of a forum when a like is added to it
exports.sendLikeNotification = functions.database.ref('/forumData/{forumId}/likers/{newLike}')
    .onCreate(((snapshotMain, context) => {
        const senderId = context.params.newLike;
        const topic = context.params.forumId;
        const type = "newLike_Dislike";
        const forumId = context.params.forumId;
        return admin.database().ref('/userdata/' + senderId).once('value',(snapshot) =>
        {
            const sender = snapshot.val().name;
            const payload = {
                data:{
                    "forumId" : forumId,
                    "initiator" : senderId,
                    "type" : type ,
                    "title" : "New Like",
                    "text" : sender  + likeTexts[Math.floor(Math.random() * 10)]
                }
            };
            console.log("forum id:" + topic + "\nsenderId : " + senderId + "\nsender : " + sender + "\ntype : " + type + "\nsub-type : " + "like\n" +
                "text : " + payload.data.text);
            return admin.messaging().sendToTopic(topic,payload);

        });
    }));

// send a notification to the sender of a forum when a dislike is added to it
exports.sendDislikeNotification = functions.database.ref('/forumData/{forumId}/disLikers/{newDislike}')
    .onCreate(((snapshot, context) => {
        const senderId = context.params.newDislike;
        const topic = context.params.forumId;
        const type = "newLike_Dislike";
        const forumId = context.params.forumId;
        return admin.database().ref('/userdata/' + senderId).once('value',(snapshot) =>
        {
            const sender = snapshot.val().name;
            let payload = {
                data:{
                    "forumId" : forumId,
                    "initiator" : senderId,
                    "type" : type,
                    "title" : "Dislike :(",
                    "text" : sender  + dislikeTexts[Math.floor(Math.random() * 10)]
                }
            };

            console.log("forum id:" + topic +
                "\nsender : " + sender +
                "\ntype : " + type +
                "\nsub-type : " + "dislike " +
                "\ntext : " + payload.data.text
            );

            return admin.messaging().sendToTopic(topic,payload);

        });
    }));

// send a notification to the receiver of a message
exports.sendNewMessageNotification = functions.database.ref('/messageData/{conversationId}/messages/{messageId}')
    .onCreate(((snapshot,context) => {

        const conversationId = context.params.conversationId;
        const newMessage = snapshot.val();
        const senderId = newMessage.sender;
        const message = newMessage.messageText;
        const type = "newMessage";

        return admin.database().ref('/').once('value',(snapshot) =>
        {

            const sender = snapshot.child("userdata").child(senderId).child("name").val();
            let receiverId  = snapshot.child("messageData").child(conversationId).child("user2").val();
            if (receiverId === senderId)
                receiverId  = snapshot.child("messageData").child(conversationId).child("user1").val();

            let payload = {
                data:{
                    "conversationId" : conversationId,
                    "initiator" : senderId,
                    "type" : type,
                    "title" : "New Message",
                    "text" : sender + " has sent you a new message",
                    "message" : message
                }
            };

            console.log("conversation id:" + conversationId +
                "\ntopic : " + receiverId,
                "\nsender : " + sender +
                "\ntype : " + type  +
                "\ntext : " + payload.data.text
            );

            return admin.messaging().sendToTopic(receiverId,payload);
        });

    }));

// send a notification to everyone when an update is released
exports.sendVersionUpdateNotification = functions.database.ref('/patches/{newPatch}')
    .onCreate(((snapshot,context) => {

    const type = "versionUpdate";
    const title = snapshot.child("title").val();
    const version = snapshot.child("versionNo").val();
    const topic = "allUsers";
    let payload = {
        data:{
            "initiator" : "admin",
            "type" : type,
            "title" : title + " has just been released",
            "text" : "Application has been updated to version " + version + ". Update the app to use the latest features",
        }
    };

    return admin.messaging().sendToTopic(topic,payload);

}));