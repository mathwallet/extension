// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeyringPair, KeyringPair$Json } from '@polkadot/keyring/types';

import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { u8aToString } from '@polkadot/util';

import { AccountContext, ActionContext, InputWithLabel, InputFileWithLabel, Button, Address, Warning } from '../components';
import useTranslation from '../hooks/useTranslation';
import { jsonRestore, jsonGetPairFromFile } from '../messaging';
import { Header } from '../partials';

// FIXME We want to display the decodeError
interface PassState {
  decodeError?: string | null;
  password: string;
}

const acceptedFormats = ['application/json', 'text/plain'].join(', ');

export default function Upload (): React.ReactElement {
  const { t } = useTranslation();
  const { accounts } = useContext(AccountContext);
  const onAction = useContext(ActionContext);
  const [isBusy, setIsBusy] = useState(false);
  const [pair, setPair] = useState<KeyringPair | null>(null);
  const [file, setFile] = useState<KeyringPair$Json | null>(null);
  const [{ decodeError, password }, setPass] = useState<PassState>({ password: '' });

  console.log('decodeError', decodeError);
  useEffect((): void => {
    !accounts.length && onAction();
  }, [accounts, onAction]);

  const _onChangePass = useCallback(
    (password: string): void => {
      setPass({ password });
      // jsonVerifyPassword(password)
      //   .then((isPassValid) => )
      //   .catch(console.error);
    }, []
  );

  const _onChangeFile = useCallback(
    (upload: Uint8Array) => {
      const json = JSON.parse(u8aToString(upload)) as KeyringPair$Json;

      setFile(json);

      jsonGetPairFromFile(json)
        .then((pair) => {
          if (!pair) {
            console.error('oops');
          }

          setPair(pair);
        })
        .catch(console.error);
    },
    []
  );

  // const _onRestore = useCallback(
  //   (): void => {
  //     if (!json || !password) {
  //       return;
  //     }

  //     setIsBusy(true);

  //     jsonRestore(json, password)
  //       .then(({ error }): void => {
  //         if (error) {
  //           setIsBusy(false);
  //           setPass(({ password }) => ({ decodeError: error, isPassValid: false, password }));
  //         } else {
  //           onAction('/');
  //         }
  //       })
  //       .catch(console.error);
  //   },
  //   [json, onAction, password]
  // );

  const _onRestore = useCallback(
    (): void => {
      if (!file || !password) {
        return;
      }

      setIsBusy(true);
      // setTimeout((): void => {
      jsonRestore(file, password)
        .then(({ error }): void => {
          if (error) {
            setIsBusy(false);
            setPass(({ password }) => ({ decodeError: error, password }));
          } else {
            onAction('/');
          }
        })
        .catch(console.error);
      // }, 0);
    },
    [file, onAction, password]
  );

  return (
    <>
      <HeaderWithSmallerMargin
        showBackArrow
        text={t<string>('Restore from JSON')}
      />
      <div>
        <div>
          <Address
            address={pair?.address || null}
            genesisHash={(pair?.meta.genesisHash as string) || null}
            isEthereum={pair?.type === 'ethereum'}
            name={(pair?.meta.name as string) || null}
          />
        </div>
        <InputFileWithLabel
          accept={acceptedFormats}
          isError={!pair?.address}
          label={t<string>('backup file')}
          onChange={_onChangeFile}
          withLabel
        />
        <InputWithLabel
          isError={!decodeError}
          label={t<string>('Password for this file')}
          onChange={_onChangePass}
          type='password'
        />
        { !!decodeError && (
          <Warning
            className={'errorMessage'}
            isBelowInput
            isDanger
          >
            {t<string>('Invalid file or password')}
          </Warning>)}
        <Button
          isBusy={isBusy}
          isDisabled={!pair?.address || !password || !!decodeError}
          onClick={_onRestore}
        >
          {t<string>('Restore')}
        </Button>
      </div>
    </>
  );
}

const HeaderWithSmallerMargin = styled(Header)`
  margin-bottom: 15px;

  .errorMessage {
    margin-bottom: 6px;
  }
`;
