mod db_manager;
use axum::{routing::get, Router};
use db_manager::LobbyDatabase;

#[tokio::main]
async fn main() {
    let lobby_database = LobbyDatabase::database_init();
    let state = AppState {
        database: lobby_database,
    };

    // build our application with a single route
    let app = Router::new()
        .route("/", get(|| async { "Hello, World!" }))
        .with_state(state);

    // run our app with hyper, listening globally on port 3000
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

#[derive(Clone)]
struct AppState {
    database: LobbyDatabase,
}
