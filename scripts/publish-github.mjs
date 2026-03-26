import { execFileSync } from "node:child_process";
import process from "node:process";

const projectRoot = process.cwd();
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const customMessage = process.argv.slice(2).join(" ").trim();

function quoteForCmd(value) {
  const text = String(value ?? "");
  return /[\s"&^<>|()]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function run(command, args) {
  console.log(`\n> ${command} ${args.join(" ")}`);

  if (process.platform === "win32" && command.toLowerCase().endsWith(".cmd")) {
    execFileSync("cmd.exe", ["/d", "/s", "/c", `${command} ${args.map(quoteForCmd).join(" ")}`], {
      cwd: projectRoot,
      stdio: "inherit"
    });
    return;
  }

  execFileSync(command, args, {
    cwd: projectRoot,
    stdio: "inherit"
  });
}

function capture(command, args) {
  if (process.platform === "win32" && command.toLowerCase().endsWith(".cmd")) {
    return execFileSync("cmd.exe", ["/d", "/s", "/c", `${command} ${args.map(quoteForCmd).join(" ")}`], {
      cwd: projectRoot,
      encoding: "utf8"
    }).trim();
  }

  return execFileSync(command, args, {
    cwd: projectRoot,
    encoding: "utf8"
  }).trim();
}

try {
  run(npmCommand, ["run", "export:static"]);
  run(npmCommand, ["run", "build"]);

  const currentStatus = capture("git", ["status", "--short"]);
  if (!currentStatus) {
    console.log("\nNo changes to publish.");
    process.exit(0);
  }

  run("git", ["add", "-A"]);

  const stagedStatus = capture("git", ["status", "--short"]);
  if (!stagedStatus) {
    console.log("\nNothing new was staged.");
    process.exit(0);
  }

  const commitMessage = customMessage || `Publish portfolio ${new Date().toISOString().replace(/\.\d{3}Z$/, "Z")}`;
  run("git", ["commit", "-m", commitMessage]);
  run("git", ["push", "origin", "HEAD"]);

  console.log("\nPublished to GitHub. GitHub Actions will redeploy the public site.");
} catch (error) {
  console.error("\nPublish stopped.");
  process.exit(error?.status || 1);
}
