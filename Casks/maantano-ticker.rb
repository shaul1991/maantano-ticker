cask "maantano-ticker" do
  version "1.2.0"
  sha256 :no_check # Auto-update on each release

  depends_on arch: :arm64

  url "https://github.com/maantano/maantano-ticker/releases/download/v#{version}/Maantano.Ticker-#{version}-arm64.dmg"
  name "Maantano Ticker"
  desc "Real-time Korean stock ticker for macOS menubar"
  homepage "https://github.com/maantano/maantano-ticker"

  livecheck do
    url :url
    strategy :github_latest
  end

  app "Maantano Ticker.app"

  zap trash: [
    "~/Library/Application Support/maantano-ticker",
    "~/Library/Preferences/com.maantano-ticker.app.plist",
  ]
end
