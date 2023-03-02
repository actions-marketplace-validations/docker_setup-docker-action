import os from 'os';
import path from 'path';
import * as uuid from 'uuid';
import * as core from '@actions/core';
import * as actionsToolkit from '@docker/actions-toolkit';

import {Install} from '../../../docker_org/actions/docker-actions-toolkit/lib/docker/install';
import {Docker} from '../../../docker_org/actions/docker-actions-toolkit/lib/docker/docker';

import * as context from './context';
import * as stateHelper from './state-helper';

actionsToolkit.run(
  // main
  async () => {
    const input: context.Inputs = context.getInputs();

    const install = new Install();
    let toolDir;
    if (!(await Docker.isAvailable()) || input.version) {
      await core.group(`Download docker`, async () => {
        toolDir = await install.download(input.version || 'latest');
      });
    }
    if (toolDir) {
      const runDir = path.join(os.homedir(), `setup-docker-action-${uuid.v4()}`);
      stateHelper.setRunDir(runDir);
      await install.install(toolDir, runDir, input.version);
    }

    await core.group(`Docker info`, async () => {
      await Docker.printVersion();
      await Docker.printInfo();
    });
  },
  // post
  async () => {
    if (stateHelper.runDir.length == 0) {
      return;
    }
    const install = new Install();
    await install.tearDown(stateHelper.runDir);
  }
);
