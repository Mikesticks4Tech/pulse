const express = require("express");
const { Octokit } = require("octokit");

const router = express.Router();
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const USERNAME = process.env.GITHUB_USERNAME;

// --- GET all repos for the user ---
router.get("/repos", async (req, res) => {
  try {
    const response = await octokit.request("GET /users/{username}/repos", {
      username: USERNAME,
      sort: "updated",
      per_page: 20,
    });

    const repos = response.data.map((repo) => ({
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      updatedAt: repo.updated_at,
      language: repo.language,
      stars: repo.stargazers_count,
      url: repo.html_url,
    }));

    res.json(repos);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to fetch repos", error: err.message });
  }
});

// --- GET recent commits for a specific repo ---
router.get("/repos/:repo/commits", async (req, res) => {
  try {
    const response = await octokit.request(
      "GET /repos/{owner}/{repo}/commits",
      {
        owner: USERNAME,
        repo: req.params.repo,
        per_page: 15,
      },
    );

    const commits = response.data.map((c) => ({
      sha: c.sha.substring(0, 7),
      message: c.commit.message,
      author: c.commit.author.name,
      date: c.commit.author.date,
      url: c.html_url,
    }));

    res.json(commits);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to fetch commits", error: err.message });
  }
});

// --- GET commits across ALL repos from the last N days (for a daily summary view) ---
router.get("/activity", async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 1;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const reposResponse = await octokit.request("GET /users/{username}/repos", {
      username: USERNAME,
      sort: "pushed",
      per_page: 10,
    });

    const activity = [];

    for (const repo of reposResponse.data) {
      // Skip repos that haven't been pushed to recently at all — saves API calls
      if (new Date(repo.pushed_at) < since) continue;

      const commitsResponse = await octokit.request(
        "GET /repos/{owner}/{repo}/commits",
        {
          owner: USERNAME,
          repo: repo.name,
          since: since.toISOString(),
          per_page: 30,
        },
      );

      if (commitsResponse.data.length > 0) {
        activity.push({
          repo: repo.name,
          commits: commitsResponse.data.map((c) => ({
            sha: c.sha.substring(0, 7),
            message: c.commit.message,
            date: c.commit.author.date,
          })),
        });
      }
    }

    res.json(activity);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to fetch activity", error: err.message });
  }
});

module.exports = router;
