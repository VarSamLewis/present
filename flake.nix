{
  description = "Vibeslide — local-first document-to-presentation app";

  # Pinned to the nixpkgs revision that ships Playwright 1.61.1, matching
  # package-lock.json (playwright@1.61.1). Playwright refuses to run when its
  # browser revision does not match, so keep this pin in sync when bumping the
  # npm playwright dependency. (Node 20 is EOL here, hence nodejs_22 — it
  # matches .nvmrc.)
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/6d91bcd51e5275b3609604429b86ce4683abc930";

  outputs =
    { self, nixpkgs }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      forAllSystems = f: nixpkgs.lib.genAttrs systems (system: f nixpkgs.legacyPackages.${system});
    in
    {
      devShells = forAllSystems (pkgs: {
        default = pkgs.mkShell {
          packages = [
            # Runtime + package manager (matches .nvmrc)
            pkgs.nodejs_22

            # Native addon toolchain for better-sqlite3 when no prebuilt is
            # available (npm ci / npm rebuild).
            pkgs.python3
            pkgs.gnumake
            pkgs.stdenv.cc
            pkgs.pkg-config

            # SQLite CLI for backups and inspection
            pkgs.sqlite

            # Nixpkgs' patched Chromium build for Playwright. This is what makes
            # slide validation and PDF export work on NixOS without FHS hacks.
            pkgs.playwright-driver.browsers
          ];

          env = {
            PLAYWRIGHT_BROWSERS_PATH = "${pkgs.playwright-driver.browsers}";
            PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = "1";
          };

          shellHook = ''
            echo "Vibeslide dev shell"
            echo "  node $(node --version) / npm $(npm --version)"
            echo "  Playwright browsers: $PLAYWRIGHT_BROWSERS_PATH"
            echo ""
            echo "  npm ci                     # install dependencies"
            echo "  npm run dev                # http://localhost:3000"
            echo "  npm run lint && npm run typecheck && npm test"
            echo "  see docs/command.md for everything else"
          '';
        };
      });

      formatter = forAllSystems (pkgs: pkgs.nixfmt);
    };
}
