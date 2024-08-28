use serde::{Deserialize, Serialize};
use std::sync::{Arc, RwLock};
use tokio_rusqlite::{params, Connection};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Lobby {
    id: String,
    username: String,
    lobby_id: String,
    lobby_password: String,
    user_character: String,
    seeking_characters: Vec<String>,
    created_time: String,
}

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
            created_time TEXT NOT NULL)",
                [],
            )
            .unwrap();
            Ok(())
        });
        LobbyDatabase {
            database: Arc::new(RwLock::new(db)),
        }
    }

    pub async fn create_lobby(&self, lobby: Lobby) -> String {
        let id = Uuid::new_v4().to_string();
        let seeking_characters = serde_json::to_string(&lobby.seeking_characters).unwrap();
        let db = self.database.read().await;

        self.database
            .read()
            .unwrap()
            .execute(
                "INSERT INTO lobby(
            id,
            username,
            lobby_id,
            lobby_password,
            user_character,
            seeking_character,
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
        id
    }

    pub fn get_all_lobbies(&self) -> Vec<Lobby> {
        self.database
            .read()
            .unwrap()
            .prepare("SELECT * FROM lobby")
            .unwrap()
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
            .collect()
    }

    pub fn delete_lobby(&self, id: String) {
        self.database
            .read()
            .unwrap()
            .execute("DELETE FROM lobby WHERE id = ?1", params![id])
            .unwrap();
    }

    pub fn update_lobby() {
        todo!();
    }
}
