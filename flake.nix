{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    devenv.url = "github:cachix/devenv";
    devenv-root = {
      url = "file+file:///dev/null";
      flake = false;
    };
  };

  nixConfig = {
    extra-trusted-public-keys = "devenv.cachix.org-1:w1cLUi8dv3hnoSPGAuibQv+f9TZLr6cv/Hm9XgU50cw=";
    extra-substituters = "https://devenv.cachix.org";
  };

  outputs = { self, nixpkgs, devenv, devenv-root, ... } @ inputs:
    let
      systems = [ "x86_64-linux" "x86_64-darwin" "aarch64-linux" "aarch64-darwin" ];
      forAllSystems = f: builtins.listToAttrs (map (name: { inherit name; value = f name; }) systems);
      devenvRootFileContent = builtins.readFile devenv-root.outPath;
    in
    {
      packages = forAllSystems (system: {
        devenv-up = self.devShells.${system}.default.config.procfileScript;
      });

      devShells = forAllSystems
        (system:
          let
            pkgs = nixpkgs.legacyPackages.${system};
          in
          {
            default = devenv.lib.mkShell {
              inherit inputs pkgs;
              modules = [
                {
                  devenv.root =
                    let
                      devenvRoot = builtins.readFile devenv-root.outPath;
                    in
                    pkgs.lib.mkIf (devenvRoot != "") devenvRoot;
                }
                ./devenv.nix
              ];
            };
          });
    };
}
