// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, SystemTray, SystemTrayMenu, SystemTrayMenuItem, CustomMenuItem};

// Tauri commands - callable from JS via invoke()
#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
fn open_ticket_window(handle: tauri::AppHandle, booking_ref: String) {
    let url = format!("http://localhost:3000/api/bookings/{}/ticket", booking_ref);
    tauri::WindowBuilder::new(
        &handle,
        format!("ticket-{}", booking_ref),
        tauri::WindowUrl::External(url.parse().unwrap()),
    )
    .title(format!("Ticket — {}", booking_ref))
    .inner_size(700.0, 600.0)
    .resizable(true)
    .center()
    .build()
    .unwrap();
}

#[tauri::command]
fn minimize_window(window: tauri::Window) {
    window.minimize().unwrap();
}

#[tauri::command]
fn maximize_window(window: tauri::Window) {
    if window.is_maximized().unwrap() {
        window.unmaximize().unwrap();
    } else {
        window.maximize().unwrap();
    }
}

#[tauri::command]
fn close_window(window: tauri::Window) {
    window.close().unwrap();
}

#[tauri::command]
fn show_notification(title: String, body: String) -> Result<(), String> {
    // Uses OS notification
    println!("Notification: {} - {}", title, body);
    Ok(())
}

fn main() {
    // System tray
    let quit = CustomMenuItem::new("quit".to_string(), "Quit CinePOS");
    let show = CustomMenuItem::new("show".to_string(), "Show Window");
    let tray_menu = SystemTrayMenu::new()
        .add_item(show)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);

    let system_tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            tauri::SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "quit" => std::process::exit(0),
                "show" => {
                    if let Some(window) = app.get_window("main") {
                        window.show().unwrap();
                        window.set_focus().unwrap();
                    }
                }
                _ => {}
            },
            tauri::SystemTrayEvent::DoubleClick { .. } => {
                if let Some(window) = app.get_window("main") {
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
            }
            _ => {}
        })
        .setup(|app| {
            let window = app.get_window("main").unwrap();
            window.set_min_size(Some(tauri::Size::Physical(tauri::PhysicalSize {
                width: 900,
                height: 600,
            }))).unwrap();
            // Start Next.js server in background when in production
            #[cfg(not(debug_assertions))]
            {
                use std::process::Command;
                std::thread::spawn(|| {
                    Command::new("node")
                        .arg("server.js")
                        .spawn()
                        .expect("Failed to start Next.js server");
                });
                // Give server time to start
                std::thread::sleep(std::time::Duration::from_millis(2000));
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_app_version,
            open_ticket_window,
            minimize_window,
            maximize_window,
            close_window,
            show_notification,
        ])
        .run(tauri::generate_context!())
        .expect("error while running CinePOS");
}
