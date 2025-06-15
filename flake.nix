{
  description = "Music Helper JavaScript Project";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
        };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Node.js
            nodejs_20
            
            # Bun runtime
            bun
            
            # Additional useful tools
            nodePackages.npm
            nodePackages.yarn
          ];

          shellHook = ''
            echo "Welcome to the Music Helper JavaScript development environment!"
            echo "Available tools:"
            echo " - Node.js: $(node --version)"
            echo " - npm: $(npm --version)"
            echo " - Bun: $(bun --version)"
            echo ""
            echo "Run 'npm start' to start the application"
          '';
        };
      }
    );
}