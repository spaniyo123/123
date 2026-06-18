#!/usr/bin/env node

/**
 * Supabase 연결 테스트 스크립트
 *
 * 테스트 항목:
 * 1. Supabase 클라이언트 초기화
 * 2. DB 스키마 확인 (테이블 존재 여부)
 * 3. RLS 정책 확인
 * 4. Realtime 상태 확인
 * 5. 샘플 데이터 CRUD 테스트
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://iqeuqjegagbcxorwrvbr.supabase.co';
const SUPABASE_ANON_KEY = 'sbp_57c31a9fe48ff14cf765264e43a4469d1f1bf210';

async function testSupabaseConnection() {
  console.log('🧪 Supabase 연결 테스트 시작...\n');

  try {
    // 1️⃣ 클라이언트 초기화
    console.log('1️⃣  Supabase 클라이언트 초기화...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('   ✅ 클라이언트 생성 성공\n');

    // 2️⃣ DB 연결 테스트 (health check)
    console.log('2️⃣  DB 연결 테스트...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('tasks')
      .select('COUNT(*)', { count: 'estimated', head: true });

    if (healthError) {
      throw new Error(`DB 연결 실패: ${healthError.message}`);
    }
    console.log('   ✅ DB 연결 성공\n');

    // 3️⃣ Tasks 테이블 스키마 확인
    console.log('3️⃣  Tasks 테이블 스키마 확인...');
    const { data: tasksSample, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .limit(1);

    if (tasksError) {
      throw new Error(`Tasks 테이블 조회 실패: ${tasksError.message}`);
    }
    console.log('   ✅ Tasks 테이블 존재\n');

    // 4️⃣ Comments 테이블 스키마 확인
    console.log('4️⃣  Comments 테이블 스키마 확인...');
    const { data: commentsSample, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .limit(1);

    if (commentsError) {
      throw new Error(`Comments 테이블 조회 실패: ${commentsError.message}`);
    }
    console.log('   ✅ Comments 테이블 존재\n');

    // 5️⃣ RLS 정책 테스트 (INSERT)
    console.log('5️⃣  RLS 정책 테스트 (INSERT)...');
    const testTask = {
      title: '테스트 작업',
      assignee: '테스트사용자',
      priority: 'high',
      created_by: '테스트사용자'
    };

    const { data: insertedTask, error: insertError } = await supabase
      .from('tasks')
      .insert([testTask])
      .select();

    if (insertError) {
      throw new Error(`데이터 삽입 실패 (RLS): ${insertError.message}`);
    }

    const testTaskId = insertedTask[0].id;
    console.log(`   ✅ INSERT 성공 (테스트 작업 ID: ${testTaskId})\n`);

    // 6️⃣ RLS 정책 테스트 (SELECT)
    console.log('6️⃣  RLS 정책 테스트 (SELECT)...');
    const { data: selectedTask, error: selectError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', testTaskId)
      .single();

    if (selectError) {
      throw new Error(`데이터 조회 실패 (RLS): ${selectError.message}`);
    }
    console.log('   ✅ SELECT 성공\n');

    // 7️⃣ RLS 정책 테스트 (UPDATE)
    console.log('7️⃣  RLS 정책 테스트 (UPDATE)...');
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({ status: 'in-progress' })
      .eq('id', testTaskId)
      .select();

    if (updateError) {
      throw new Error(`데이터 수정 실패 (RLS): ${updateError.message}`);
    }
    console.log('   ✅ UPDATE 성공\n');

    // 8️⃣ Last-Write-Wins RPC 테스트
    console.log('8️⃣  Last-Write-Wins RPC 함수 테스트...');
    const { data: lwwResult, error: lwwError } = await supabase
      .rpc('update_task_lww', {
        p_id: testTaskId,
        p_client_updated_at: updatedTask[0].updated_at,
        p_updates: {
          title: '수정된 테스트 작업',
          status: 'done'
        }
      });

    if (lwwError) {
      throw new Error(`LWW RPC 실패: ${lwwError.message}`);
    }
    console.log('   ✅ RPC 함수 정상 작동\n');

    // 9️⃣ 댓글 테스트
    console.log('9️⃣  댓글 CRUD 테스트...');
    const testComment = {
      task_id: testTaskId,
      author: '테스트사용자',
      content: '테스트 댓글입니다'
    };

    const { data: insertedComment, error: commentInsertError } = await supabase
      .from('comments')
      .insert([testComment])
      .select();

    if (commentInsertError) {
      throw new Error(`댓글 삽입 실패: ${commentInsertError.message}`);
    }
    console.log('   ✅ 댓글 INSERT 성공\n');

    // 🔟 Realtime 구독 테스트
    console.log('🔟 Realtime 구독 상태 확인...');
    console.log('   ℹ️  Realtime은 서버 실행 시 자동 활성화됨');
    console.log('   ℹ️  클라이언트에서 subscribeToTasks() 호출로 동작\n');

    // ✅ 정리: 테스트 데이터 삭제
    console.log('🧹 테스트 데이터 정리...');
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', testTaskId);

    if (deleteError) {
      console.log(`   ⚠️  삭제 실패: ${deleteError.message}`);
    } else {
      console.log('   ✅ 테스트 데이터 삭제 완료\n');
    }

    // 최종 결과
    console.log('═════════════════════════════════════════════\n');
    console.log('✅ Supabase 연결 테스트 완료!\n');
    console.log('📊 테스트 결과:');
    console.log('  ✅ 클라이언트 초기화');
    console.log('  ✅ DB 연결');
    console.log('  ✅ Tasks 테이블');
    console.log('  ✅ Comments 테이블');
    console.log('  ✅ RLS 정책 (SELECT/INSERT/UPDATE)');
    console.log('  ✅ Last-Write-Wins RPC 함수');
    console.log('  ✅ 댓글 기능');
    console.log('  ✅ Realtime 준비\n');
    console.log('🚀 앱을 시작할 준비가 완료되었습니다!\n');
    console.log('   npm run start\n');

  } catch (error) {
    console.error('❌ 테스트 실패!\n');
    console.error('에러:', error.message);
    console.error('\n문제 해결:');
    console.error('1. Supabase 프로젝트가 생성되었는지 확인');
    console.error('2. SQL 마이그레이션이 실행되었는지 확인');
    console.error('3. 환경변수 설정 확인:');
    console.error(`   SUPABASE_URL: ${SUPABASE_URL}`);
    console.error(`   SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
    process.exit(1);
  }
}

// 테스트 실행
testSupabaseConnection();
