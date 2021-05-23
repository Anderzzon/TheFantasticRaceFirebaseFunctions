const functions = require("firebase-functions");

const admin = require("firebase-admin");
const {firestore} = require("firebase-admin");
admin.initializeApp();

exports.createGameAndInviteUsers = functions.firestore.document("/races/{id}")
    .onCreate((snap, context) => {
      const gameData = snap.data();
      const docID = context.params.id;

      gameData.listOfPlayers.forEach((player) => {
        const invite = admin.firestore();

        const doc = {
          accepted: false,
        };
        return invite
            .collection("users")
            .doc(player.uid)
            .collection("invites")
            .doc(docID)
            .set(doc)
            .catch((error) => {
              console.log("Error writing document: " + error);
              return false;
            });
      });
      // console.log("context", context.params.id);
      // console.log("data", change.after.data());
      return null;
    });

exports.updateGameAndInviteUsers = functions.firestore
    .document("/races/{id}")
    .onUpdate((change, context) => {
      // const game = context.params.id;
      // const data = snap.data();
      const dataAfter = change.after.data();
      // const dataBefore = change.before.data();
      const docID = context.params.id;

      dataAfter.listOfPlayers.forEach((player) => {
        const invite = admin.firestore();

        if (dataAfter.accepted == false) {
          const doc = {
            accepted: false,
          };
          return invite
              .collection("users")
              .doc(player.uid)
              .collection("invites")
              .doc(docID)
              .set(doc)
              .catch((error) => {
                console.log("Error writing document: " + error);
                return false;
              });
        }
      });
      // console.log("context", context.params.id);
      // console.log("data", change.after.data());
      return null;
    });

exports.acceptInvitation = functions.firestore
    .document("/users/{user}/{invites}/{documentID}")
    .onUpdate((change, context) => {
      // const dataAfter = change.after.data();
      const user = context.params.user;
      const docID = context.params.documentID;

      // console.log(dataAfter);
      // console.log(user);
      // console.log(docID);

      const update = admin.firestore();
      update
          .collection("users")
          .doc(user).get()
          .then((userInfo) => {
            if (userInfo.exists) {
              const userData = userInfo.data();
              const oldValue = {
                accepted: false,
                email: userData.email,
                name: userData.name,
                uid: user,
              };
              const acceptDoc = {
                accepted: true,
                email: userData.email,
                name: userData.name,
                uid: user,
              };
              const playerDocument = {
                finishedStops: 0,
                id: user,
                name: userData.name,
                lat: 0,
                lng: 0,
              };
              update
                  .collection("races")
                  .doc(docID)
                  .update({
                    listOfPlayers: firestore.FieldValue.arrayRemove(oldValue),
                  });
              update
                  .collection("races")
                  .doc(docID)
                  .collection("players")
                  .doc(user)
                  .set(playerDocument, {merge: true});
              return update
                  .collection("races")
                  .doc(docID)
                  .update({
                    listOfPlayers: firestore.FieldValue.arrayUnion(acceptDoc),
                  });
            }
          });
    });
