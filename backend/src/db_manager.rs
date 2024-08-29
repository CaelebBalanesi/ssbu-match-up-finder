use serde::{Deserialize, Serialize};
use std::sync::{Arc, RwLock};
use tokio_rusqlite::{params, Connection};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Lobby {
    pub id: String,
    pub username: String,
    pub lobby_id: String,
    pub lobby_password: String,
    pub user_character: String,
    pub seeking_characters: Vec<String>,
    pub created_time: String,
}

#[derive(Clone)]
pub struct LobbyDatabase {
    database: Arc<RwLock<Connection>>,
}

impl LobbyDatabase {
    pub async fn database_init() -> LobbyDatabase {
        let db = Connection::open("./lobby.db").await.unwrap();

        db.call(|db| {
            db.execute(
                "CREATE TABLE IF NOT EXISTS lobby(
                    id TEXT PRIMARY KEY,
                    username TEXT NOT NULL,
                    lobby_id TEXT NOT NULL,
                    lobby_password TEXT NOT NULL,
                    user_character TEXT NOT NULL,
                    seeking_characters TEXT NOT NULL,
                    created_time TEXT NOT NULL
                )",
                [],
            )
            .unwrap();
            Ok(())
        })
        .await
        .unwrap();

        LobbyDatabase {
            database: Arc::new(RwLock::new(db)),
        }
    }

    pub async fn create_lobby(&self, lobby: Lobby) -> String {
        let id = Uuid::new_v4().to_string();
        let seeking_characters = serde_json::to_string(&lobby.seeking_characters).unwrap();
        let db = self.database.read().unwrap();
        let id_clone = id.clone();

        db.call(move |db| {
            db.execute(
                "INSERT INTO lobby(
                    id,
                    username,
                    lobby_id,
                    lobby_password,
                    user_character,
                    seeking_characters,
                    created_time
                ) VALUES (
                    ?1,
                    ?2,
                    ?3,
                    ?4,
                    ?5,
                    ?6,
                    ?7
                )",
                params![
                    id,
                    lobby.username,
                    lobby.lobby_id,
                    lobby.lobby_password,
                    lobby.user_character,
                    seeking_characters,
                    lobby.created_time
                ],
            )
            .unwrap();
            Ok(())
        })
        .await
        .unwrap();

        id_clone
    }

    pub async fn get_all_lobbies(&self) -> Vec<Lobby> {
        let db = self.database.read().unwrap();

        let lobbies = db
            .call(|db| {
                let mut stmt = db.prepare("SELECT * FROM lobby").unwrap();
                let rows = stmt
                    .query_map([], |row| {
                        let seeking: String = row.get(5).unwrap();
                        Ok(Lobby {
                            id: row.get(0).unwrap(),
                            username: row.get(1).unwrap(),
                            lobby_id: row.get(2).unwrap(),
                            lobby_password: row.get(3).unwrap(),
                            user_character: row.get(4).unwrap(),
                            seeking_characters: serde_json::from_str(&seeking).unwrap(),
                            created_time: row.get(6).unwrap(),
                        })
                    })
                    .unwrap()
                    .map(|x| x.unwrap())
                    .collect::<Vec<Lobby>>();
                Ok(rows)
            })
            .await
            .unwrap();

        lobbies
    }

    pub async fn delete_lobby(&self, id: String) {
        let db = self.database.read().unwrap();

        db.call(move |db| {
            db.execute("DELETE FROM lobby WHERE id = ?1", params![id])
                .unwrap();
            Ok(())
        })
        .await
        .unwrap();
    }

    pub fn update_lobby() {
        todo!();
    }
}
