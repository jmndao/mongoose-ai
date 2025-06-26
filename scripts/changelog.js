#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const package = require("../package.json");
const changelogPath = path.join(__dirname, "../CHANGELOG.md");

function getCurrentDate() {
  return new Date().toISOString().split("T")[0];
}

function getGitCommitsSinceLastTag() {
  try {
    const lastTag = execSync("git describe --tags --abbrev=0", {
      encoding: "utf8",
    }).trim();
    const commits = execSync(`git log ${lastTag}..HEAD --oneline --no-merges`, {
      encoding: "utf8",
    })
      .trim()
      .split("\n")
      .filter((line) => line.length > 0);
    return commits;
  } catch (error) {
    // No previous tags, get all commits
    const commits = execSync("git log --oneline --no-merges", {
      encoding: "utf8",
    })
      .trim()
      .split("\n")
      .filter((line) => line.length > 0);
    return commits;
  }
}

function categorizeCommits(commits) {
  const categories = {
    added: [],
    changed: [],
    fixed: [],
    removed: [],
    security: [],
    deprecated: [],
  };

  commits.forEach((commit) => {
    const message = commit.substring(8); // Remove commit hash
    const lower = message.toLowerCase();

    if (lower.startsWith("feat") || lower.includes("add")) {
      categories.added.push(message);
    } else if (lower.startsWith("fix") || lower.includes("bug")) {
      categories.fixed.push(message);
    } else if (lower.startsWith("refactor") || lower.includes("change")) {
      categories.changed.push(message);
    } else if (lower.includes("remove") || lower.includes("delete")) {
      categories.removed.push(message);
    } else if (lower.includes("security")) {
      categories.security.push(message);
    } else if (lower.includes("deprecat")) {
      categories.deprecated.push(message);
    } else {
      categories.changed.push(message);
    }
  });

  return categories;
}

function generateChangelogEntry(version, categories) {
  const date = getCurrentDate();
  let entry = `## [${version}] - ${date}\n\n`;

  if (categories.added.length > 0) {
    entry += "### Added\n";
    categories.added.forEach((item) => {
      entry += `- ${item}\n`;
    });
    entry += "\n";
  }

  if (categories.changed.length > 0) {
    entry += "### Changed\n";
    categories.changed.forEach((item) => {
      entry += `- ${item}\n`;
    });
    entry += "\n";
  }

  if (categories.fixed.length > 0) {
    entry += "### Fixed\n";
    categories.fixed.forEach((item) => {
      entry += `- ${item}\n`;
    });
    entry += "\n";
  }

  if (categories.removed.length > 0) {
    entry += "### Removed\n";
    categories.removed.forEach((item) => {
      entry += `- ${item}\n`;
    });
    entry += "\n";
  }

  if (categories.deprecated.length > 0) {
    entry += "### Deprecated\n";
    categories.deprecated.forEach((item) => {
      entry += `- ${item}\n`;
    });
    entry += "\n";
  }

  if (categories.security.length > 0) {
    entry += "### Security\n";
    categories.security.forEach((item) => {
      entry += `- ${item}\n`;
    });
    entry += "\n";
  }

  return entry;
}

function updateChangelog(newEntry) {
  let changelog = fs.readFileSync(changelogPath, "utf8");

  // Find the position after the header and insert new entry
  const headerEnd = changelog.indexOf("\n## ");
  if (headerEnd === -1) {
    // No existing entries, add after header
    const firstSectionStart = changelog.indexOf("\n\n") + 2;
    changelog =
      changelog.slice(0, firstSectionStart) +
      newEntry +
      changelog.slice(firstSectionStart);
  } else {
    changelog =
      changelog.slice(0, headerEnd + 1) +
      newEntry +
      changelog.slice(headerEnd + 1);
  }

  fs.writeFileSync(changelogPath, changelog);
}

function main() {
  const version = package.version;
  console.log(`Generating changelog entry for version ${version}...`);

  const commits = getGitCommitsSinceLastTag();
  if (commits.length === 0) {
    console.log("No new commits found since last tag.");
    return;
  }

  console.log(`Found ${commits.length} commits since last release:`);
  commits.forEach((commit) => console.log(`  ${commit}`));

  const categories = categorizeCommits(commits);
  const entry = generateChangelogEntry(version, categories);

  console.log("\nGenerated changelog entry:");
  console.log(entry);

  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  readline.question("Add this entry to CHANGELOG.md? (y/n): ", (answer) => {
    if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
      updateChangelog(entry);
      console.log("Changelog updated successfully!");
    } else {
      console.log("Changelog update cancelled.");
    }
    readline.close();
  });
}

if (require.main === module) {
  main();
}
