use tauri::menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder};

/// Builds the native menu bar with standard macOS menu items plus a custom Help submenu.
pub fn build_native_menu(app: &tauri::AppHandle) -> Result<(), tauri::Error> {
    // Help submenu items
    let docs_item = MenuItemBuilder::with_id("help-docs", "Documentation")
        .accelerator("CmdOrCtrl+Shift+D")
        .build(app)?;

    let help_submenu = SubmenuBuilder::new(app, "Help").item(&docs_item).build()?;

    // About item - use predefined on macOS, custom on Linux/Windows
    #[cfg(target_os = "macos")]
    let about_item = PredefinedMenuItem::about(app, Some("About openrice"), None)?;

    #[cfg(not(target_os = "macos"))]
    let about_item = MenuItemBuilder::with_id("about-openrice", "About openrice").build(app)?;

    // openrice app menu
    let openrice_menu = SubmenuBuilder::new(app, "openrice")
        .item(&about_item)
        .separator()
        .separator()
        .item(&PredefinedMenuItem::hide(app, Some("Hide openrice"))?)
        .item(&PredefinedMenuItem::hide_others(app, Some("Hide Others"))?)
        .item(&PredefinedMenuItem::show_all(app, Some("Show All"))?)
        .separator()
        .item(&PredefinedMenuItem::quit(app, Some("Quit openrice"))?)
        .build()?;

    // Edit menu
    let edit_menu = SubmenuBuilder::new(app, "Edit")
        .item(&PredefinedMenuItem::undo(app, Some("Undo"))?)
        .item(&PredefinedMenuItem::redo(app, Some("Redo"))?)
        .separator()
        .item(&PredefinedMenuItem::cut(app, Some("Cut"))?)
        .item(&PredefinedMenuItem::copy(app, Some("Copy"))?)
        .item(&PredefinedMenuItem::paste(app, Some("Paste"))?)
        .separator()
        .item(&PredefinedMenuItem::select_all(app, Some("Select All"))?)
        .build()?;

    let menu = MenuBuilder::new(app)
        .item(&openrice_menu)
        .item(&edit_menu)
        .item(&help_submenu)
        .build()?;

    app.set_menu(menu)?;

    // Register menu event handlers
    app.on_menu_event(move |app, event| {
        use tauri_plugin_dialog::DialogExt;

        let id = event.id().as_ref();
        if id == "help-docs" {
            if let Err(e) = crate::system::open_url_custom("https://rice.traditionow.ai/docs".to_string())
            {
                // Show error dialog to user
                app.dialog()
                    .message(format!("Failed to open documentation: {}", e))
                    .kind(tauri_plugin_dialog::MessageDialogKind::Error)
                    .show(|_| {});
            }
        } else if id == "about-openrice" {
            // Show About dialog (Linux/Windows)
            let version = env!("CARGO_PKG_VERSION");
            app.dialog()
                .message(format!("openrice v{}", version))
                .title("About openrice")
                .kind(tauri_plugin_dialog::MessageDialogKind::Info)
                .show(|_| {});
        }
    });

    Ok(())
}
