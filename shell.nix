{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  nativeBuildInputs = with pkgs; [ pkg-config cmake gnumake gcc python3 nodejs cargo rustc ];
  buildInputs = with pkgs; [ webkitgtk_4_1 gtk3 glib openssl librsvg libsoup_3 ];
  # Prefer GTK3 schemas over the GTK4 schemas inherited from GNOME.
  GSETTINGS_SCHEMA_DIR = "${pkgs.gtk3}/share/gsettings-schemas/${pkgs.gtk3.name}/glib-2.0/schemas";
  GTK_USE_PORTAL = "0";
  shellHook = ''
    export XDG_DATA_DIRS="${pkgs.gtk3}/share/gsettings-schemas/${pkgs.gtk3.name}:''${XDG_DATA_DIRS:-}"
  '';
}
