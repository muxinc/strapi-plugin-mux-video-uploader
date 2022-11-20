# Setting up your dev environment

Start by installing the (dev) dependencies—

```
% yarn install
```

Initialize [Husky](https://www.npmjs.com/package/husky) to get the pre-commit hook binary installed on your local development workstation— 

```
% yarn prepare
```

When testing your builds with Strapi, it is best to compile the Typescript and use the JavaScript output in the `./dist` directory as your candidate (this is ultimately what is published to NPM).  Generating a build can be done by running the following command—

```
% yarn build
```

# Releasing

1. Merge feature branches, bug fixes, and whatever changes into `master` after CI passes and PRs are approved
1. Create a new branch off `master` when you're ready to release a new version
1. On this branch run `npm version [...]` (see `npm-version` [docs](https://docs.npmjs.com/cli/v7/commands/npm-version) for more info) which will bump the version in `package.json` and make a tag (for example `npm version patch -m "Bump for 3.1.2"`). Follow [SemVer rules](https://semver.org/) for patch/minor/major.
1. Push the version commit and the tag `git push && git push --tags origin`
1. Open Pull Request, "Rebase and merge" after approved
1. Create a new release in the Github UI, give the release a name and add release notes (creating the release will kick off npm publish using Github Actions)
1. Checkout the `master` branch and pull the latest by running `git checkout master && git pull`
