mod db_manager;

use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{delete, get, post},
    Json, Router,
};
use db_manager::{Lobby, LobbyDatabase};
use serde::Deserialize;
use std::sync::Arc;
use tokio::net::TcpListener;

#[tokio::main]
async fn main() {
    let lobby_database = LobbyDatabase::database_init().await;
    let state = AppState {
        database: lobby_database,
    };

    // Build our application with routes
    let app = Router::new()
        .route("/", get(hello_world_handler))
        .route(
            "/lobbies",
            get(get_all_lobbies_handler).post(create_lobby_handler),
        )
        .route("/lobbies/:id", delete(delete_lobby_handler))
        .with_state(Arc::new(state));

    // Run our app with hyper, listening globally on port 3000
    let listener = TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

#[derive(Clone)]
struct AppState {
    database: LobbyDatabase,
}

#[derive(Deserialize)]
struct CreateLobbyRequest {
    username: String,
    lobby_id: String,
    lobby_password: String,
    user_character: String,
    seeking_characters: Vec<String>,
}

async fn hello_world_handler() -> &'static str {
    "Hello, World!"
}

async fn create_lobby_handler(
    Json(payload): Json<CreateLobbyRequest>,
    State(state): State<Arc<AppState>>,
) -> (StatusCode, Json<String>) {
    let lobby = Lobby {
        id: "".to_string(),
        username: payload.username,
        lobby_id: payload.lobby_id,
        lobby_password: payload.lobby_password,
        user_character: payload.user_character,
        seeking_characters: payload.seeking_characters,
        created_time: chrono::Utc::now().to_string(),
    };

    let id = state.database.create_lobby(lobby).await;
    (StatusCode::CREATED, Json(id))
}

async fn get_all_lobbies_handler(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<Lobby>>, StatusCode> {
    let lobbies = state.database.get_all_lobbies().await;
    Ok(Json(lobbies))
}

async fn delete_lobby_handler(
    Path(id): Path<String>,
    State(state): State<Arc<AppState>>,
) -> StatusCode {
    state.database.delete_lobby(id).await;
    StatusCode::NO_CONTENT
}
