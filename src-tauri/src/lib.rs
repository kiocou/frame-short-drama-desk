use serde_json::Value;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use tauri::Manager;

fn project_root() -> PathBuf {
    let manifest_root = Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap_or_else(|| Path::new("."))
        .to_path_buf();
    if manifest_root.join("tauri_bridge.py").exists() {
        return manifest_root;
    }
    std::env::current_dir().unwrap_or(manifest_root)
}

fn bridge_command(root: &Path) -> Result<(PathBuf, Vec<String>, PathBuf), String> {
    // Bundled PyInstaller exe (preferred): shipped under dist/tauri_bridge/.
    // The onedir layout puts its _internal/ deps beside the exe, so we must run
    // it from that directory rather than the resource root.
    let bundled_layout = root.join("dist").join("tauri_bridge").join("tauri_bridge.exe");
    if bundled_layout.exists() {
        let cwd = bundled_layout.parent().unwrap_or(root).to_path_buf();
        return Ok((bundled_layout, Vec::new(), cwd));
    }
    // Flat layout (older onedir or globbed resources).
    let bundled_flat = root.join("tauri_bridge.exe");
    if bundled_flat.exists() {
        let cwd = bundled_flat.parent().unwrap_or(root).to_path_buf();
        return Ok((bundled_flat, Vec::new(), cwd));
    }
    // Dev / source checkout: run tauri_bridge.py with a Python interpreter.
    let script = root.join("tauri_bridge.py");
    let venv_python = root.join(".venv").join("Scripts").join("python.exe");
    let python = if venv_python.exists() {
        venv_python
    } else {
        PathBuf::from("python")
    };
    if !script.exists() {
        return Err(format!("Bridge not found: {}", script.display()));
    }
    Ok((python, vec![script.to_string_lossy().into_owned()], root.to_path_buf()))
}

fn run_bridge(root: PathBuf, data_dir: PathBuf, action: String, payload: Value) -> Result<Value, String> {
    let (program, mut args, cwd) = bridge_command(&root)?;
    args.push(action);
    let mut command = Command::new(program);
    command
        .args(args)
        .current_dir(&cwd)
        .env("FRAME_DATA_DIR", &data_dir)
        .env("DUANJU_CONFIG_PATH", data_dir.join("config.json"))
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(0x08000000);
    }
    let mut child = command.spawn().map_err(|error| error.to_string())?;
    if let Some(stdin) = child.stdin.as_mut() {
        stdin
            .write_all(payload.to_string().as_bytes())
            .map_err(|error| error.to_string())?;
    }
    let output = child.wait_with_output().map_err(|error| error.to_string())?;
    if !output.status.success() {
        let message = String::from_utf8_lossy(&output.stderr).trim().to_string();
        return Err(if message.is_empty() { "Bridge command failed".into() } else { message });
    }
    serde_json::from_slice(&output.stdout).map_err(|error| format!("Invalid bridge response: {error}"))
}

#[tauri::command]
async fn bridge(app: tauri::AppHandle, action: String, payload: Value) -> Result<Value, String> {
    let source_root = project_root();
    let resource_root = app.path().resource_dir().ok();
    let root = resource_root
        .into_iter()
        .flat_map(|path| [path.clone(), path.join("_up_")])
        .find(|path| {
            path.join("tauri_bridge.py").exists()
                || path.join("tauri_bridge.exe").exists()
                || path.join("dist").join("tauri_bridge").join("tauri_bridge.exe").exists()
                || path.join("dist").join("tauri_bridge").join("tauri_bridge.py").exists()
        })
        .unwrap_or(source_root);
    let data_dir = app.path().app_data_dir().unwrap_or_else(|_| root.clone());
    std::fs::create_dir_all(&data_dir).map_err(|error| error.to_string())?;
    tauri::async_runtime::spawn_blocking(move || run_bridge(root, data_dir, action, payload))
        .await
        .map_err(|error| error.to_string())?
}

#[tauri::command]
fn open_folder(path: String) -> Result<(), String> {
    let target = PathBuf::from(path);
    std::fs::create_dir_all(&target).map_err(|error| error.to_string())?;
    #[cfg(target_os = "windows")]
    Command::new("explorer")
        .arg(&target)
        .spawn()
        .map_err(|error| error.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![bridge, open_folder])
        .run(tauri::generate_context!())
        .expect("error while running FRAME");
}
