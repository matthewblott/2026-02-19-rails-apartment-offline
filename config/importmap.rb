# Pin npm packages by running ./bin/importmap

pin "application"
pin "@hotwired/turbo-rails", to: "turbo.min.js"
pin "@hotwired/stimulus", to: "stimulus.min.js"
pin "@hotwired/stimulus-loading", to: "stimulus-loading.js"
pin_all_from "app/javascript/controllers", under: "controllers"

# pin "indexed_db", to: "./lib/indexed_db.js"
# pin "offline_manager", to: "./lib/offline_manager.js"

# pin_all_from "app/javascript/lib", under: "lib", to: "lib"


pin_all_from "app/javascript/lib", under: "lib"
