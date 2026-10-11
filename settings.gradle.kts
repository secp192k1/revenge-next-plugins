import java.io.File

pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
        // Xposed API (provided by the framework at runtime).
        maven(url = "https://api.xposed.info/")
        // The Revenge plugin API, published locally from the revenge-xposed repo via
        // `./gradlew :api:publishToMavenLocal`.
        mavenLocal {
            content { includeGroup("io.github.revenge") }
        }
        // CI has no local copy, so it reads the published API with the READ_PACKAGES_TOKEN secret
        maven {
            url = uri("https://maven.pkg.github.com/revenge-mod/revenge-xposed")
            credentials(PasswordCredentials::class) {
                username = providers.gradleProperty("GitHubPackagesUsername").orNull ?: System.getenv("GITHUB_ACTOR")
                password = providers.gradleProperty("GitHubPackagesPassword").orNull ?: System.getenv("GITHUB_TOKEN")
            }
            content { includeGroup("io.github.revenge") }
        }
    }
}

rootProject.name = "revenge-plugin-template"

// Each `plugins/<name>/` folder with Kotlin sources (`src/main`) is a native plugin module.
// Plugins without `src/main` are JS-only and are packaged without a Gradle project.
file("plugins").listFiles()
    ?.filter { it.isDirectory && File(it, "src/main").isDirectory }
    ?.sortedBy { it.name }
    ?.forEach { dir -> include(":plugins:${dir.name}") }
