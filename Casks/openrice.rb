cask "openrice" do
  if Hardware::CPU.intel?
    version "0.8.8"
    sha256 "07761f7dc90dc642f90268c7c0a815e57025dd648cca1d740bf8ad24d30ce26b"
    url "https://github.com/semiok/openrice/releases/download/v0.8.8/openrice_0.8.8_macOS_amd64.dmg"
  else
    version "0.8.8"
    sha256 "8fdb7197095013a9286d899a674bf226b2fd25a305cc525abaf395740e72df3d"
    url "https://github.com/semiok/openrice/releases/download/v0.8.8/openrice_0.8.8_macOS_aarch64.dmg"
  end

  name "openrice"
  desc "Local-first AI workspace assistant"
  homepage "https://github.com/semiok/openrice"

  auto_updates true

  app "openrice.app"

  zap trash: [
    "~/Library/Application Support/ai.traditionow.openrice",
  ]
end
